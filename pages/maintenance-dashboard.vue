import useSupabaseDb from '~/composables/global/useSupabaseDb'

const supabase = useSupabaseDb()

<template>
  <UDashboardNavbar>
    <template #right>
      <UButton
        color="primary"
        icon="i-heroicons-document-arrow-down"
        @click="downloadAsPDF"
      >
        تحميل PDF
      </UButton>
    </template>
  </UDashboardNavbar>
  
  <!-- محتوى الداشبورد الذي تريد تحميله -->
  <div ref="dashboardContent">
    <!-- جدول طلبات الصيانة والإحصائيات -->
  </div>
</template>
<template>
  <UContainer>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">أرشيف طلبات الصيانة</h2>
          <UButton
            icon="i-heroicons-arrow-path"
            color="gray"
            variant="ghost"
            :loading="isLoading"
            @click="fetchMaintenanceRequests"
          />
        </div>
      </template>

      <!-- بطاقات الإحصائيات -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <UCard v-for="stat in stats" :key="stat.name">
          <div class="flex items-center gap-4">
            <UIcon :name="stat.icon" class="text-2xl" :class="stat.iconClass" />
            <div>
              <div class="text-sm text-gray-500">{{ stat.name }}</div>
              <div class="text-xl font-bold">{{ stat.value }}</div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- جدول طلبات الصيانة -->
      <UTable
        :columns="columns"
        :rows="maintenanceRequests"
        :loading="isLoading"
        :sort="{ column: 'created_at', direction: 'desc' }"
        @sort="sortTable"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6">
            <UIcon name="i-heroicons-document-text" class="text-3xl mb-2 text-gray-400" />
            <p>لا توجد طلبات صيانة مؤرشفة</p>
          </div>
        </template>

        <!-- تخصيص عرض الخلايا -->
        <template #status-data="{ row }">
          <UBadge :color="getStatusColor(row.status)">{{ getStatusText(row.status) }}</UBadge>
        </template>

        <template #priority-data="{ row }">
          <UBadge :color="getPriorityColor(row.priority)">{{ getPriorityText(row.priority) }}</UBadge>
        </template>

        <template #created_at-data="{ row }">
          {{ formatDate(row.created_at) }}
        </template>

        <template #completion_date-data="{ row }">
          {{ formatDate(row.completion_date) || 'غير محدد' }}
        </template>

        <template #estimated_cost-data="{ row }">
          {{ formatCurrency(row.estimated_cost) }}
        </template>

        <template #actual_cost-data="{ row }">
          {{ formatCurrency(row.actual_cost) }}
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="getActionItems(row)">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-ellipsis-vertical"
            />
          </UDropdown>
        </template>
      </UTable>

      <!-- ترقيم الصفحات -->
      <template #footer>
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-500">
            إجمالي السجلات: {{ totalRecords }}
          </div>
          <UPagination
            v-model="currentPage"
            :total="totalRecords"
            :per-page="perPage"
            @change="changePage"
          />
        </div>
      </template>
    </UCard>

    <!-- نافذة تفاصيل الطلب -->
    <UModal v-model="isDetailsModalOpen" :ui="{ width: 'max-w-2xl' }">
      <UCard v-if="selectedRequest">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold">تفاصيل طلب الصيانة</h3>
            <UBadge :color="getStatusColor(selectedRequest.status)">
              {{ getStatusText(selectedRequest.status) }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <h4 class="font-bold mb-1">العنوان</h4>
            <p>{{ selectedRequest.title }}</p>
          </div>

          <div>
            <h4 class="font-bold mb-1">الوصف</h4>
            <p>{{ selectedRequest.description }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-bold mb-1">نوع الخدمة</h4>
              <p>{{ selectedRequest.service_type }}</p>
            </div>
            <div>
              <h4 class="font-bold mb-1">الأولوية</h4>
              <UBadge :color="getPriorityColor(selectedRequest.priority)">
                {{ getPriorityText(selectedRequest.priority) }}
              </UBadge>
            </div>
            <div>
              <h4 class="font-bold mb-1">التكلفة المقدرة</h4>
              <p>{{ formatCurrency(selectedRequest.estimated_cost) }}</p>
            </div>
            <div>
              <h4 class="font-bold mb-1">التكلفة الفعلية</h4>
              <p>{{ formatCurrency(selectedRequest.actual_cost) }}</p>
            </div>
            <div>
              <h4 class="font-bold mb-1">تاريخ الجدولة</h4>
              <p>{{ formatDate(selectedRequest.scheduled_date) || 'غير محدد' }}</p>
            </div>
            <div>
              <h4 class="font-bold mb-1">تاريخ الإنجاز</h4>
              <p>{{ formatDate(selectedRequest.completion_date) || 'غير محدد' }}</p>
            </div>
            <div>
              <h4 class="font-bold mb-1">تاريخ الإنشاء</h4>
              <p>{{ formatDate(selectedRequest.created_at) }}</p>
            </div>
            <div>
              <h4 class="font-bold mb-1">آخر تحديث</h4>
              <p>{{ formatDate(selectedRequest.updated_at) }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="solid"
              @click="isDetailsModalOpen = false"
            >
              إغلاق
            </UButton>
            <UButton
              color="primary"
              variant="solid"
              @click="restoreRequest(selectedRequest)"
            >
              استعادة الطلب
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </UContainer>
</template>

<script setup>
const supabase = useSupabaseClient()

// حالة البيانات
const maintenanceRequests = ref([])
const isLoading = ref(false)
const currentPage = ref(1)
const perPage = ref(10)
const totalRecords = ref(0)
const sortBy = ref({ column: 'created_at', direction: 'desc' })

// حالة التفاصيل
const isDetailsModalOpen = ref(false)
const selectedRequest = ref(null)

// تعريف أعمدة الجدول
const columns = [
  { key: 'title', label: 'العنوان', sortable: true },
  { key: 'status', label: 'الحالة', sortable: true },
  { key: 'priority', label: 'الأولوية', sortable: true },
  { key: 'service_type', label: 'نوع الخدمة', sortable: true },
  { key: 'estimated_cost', label: 'التكلفة المقدرة', sortable: true },
  { key: 'actual_cost', label: 'التكلفة الفعلية', sortable: true },
  { key: 'created_at', label: 'تاريخ الإنشاء', sortable: true },
  { key: 'completion_date', label: 'تاريخ الإنجاز', sortable: true },
  { key: 'actions', label: 'الإجراءات', sortable: false }
]

// الإحصائيات
const stats = ref([
  { name: 'إجمالي الطلبات', value: 0, icon: 'i-heroicons-document-text', iconClass: 'text-blue-500' },
  { name: 'مكتملة', value: 0, icon: 'i-heroicons-check-circle', iconClass: 'text-green-500' },
  { name: 'قيد التنفيذ', value: 0, icon: 'i-heroicons-clock', iconClass: 'text-yellow-500' },
  { name: 'متوسط التكلفة', value: '0', icon: 'i-heroicons-currency-dollar', iconClass: 'text-purple-500' }
])

// جلب البيانات
const fetchMaintenanceRequests = async () => {
  isLoading.value = true
  
  try {
    // حساب الإزاحة للصفحة الحالية
    const from = (currentPage.value - 1) * perPage.value
    const to = from + perPage.value - 1
    
   // استعلام عدد السجلات
   const { data, count, error } = await supabase
   .from('maintenance_requests_archive')
   .select('*', { count: 'exact' })
   .order(sortBy.value.column, { ascending: sortBy.value.direction === 'asc' })
   .range(from, to);

  if (error) {
    console.error('Error fetching maintenance requests:', error);
   return;
}
    maintenanceRequests.value = data || [];
    
    // جلب الإحصائيات
    await fetchStats()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

// جلب الإحصائيات
const fetchStats = async () => {
  try {
    // إجمالي عدد الطلبات
    const { count: totalCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
    
    // عدد الطلبات المكتملة
    const { count: completedCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    
    // عدد الطلبات قيد التنفيذ
    const { count: inProgressCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress')
    
    // متوسط التكلفة الفعلية
    const { data: costData } = await supabase
      .from('maintenance_requests_archive')
      .select('actual_cost')
      .not('actual_cost', 'is', null)
    
    let avgCost = 0
    if (costData && costData.length > 0) {
      const sum = costData.reduce((acc, item) => acc + (parseFloat(item.actual_cost) || 0), 0)
      avgCost = sum / costData.length
    }
    
    // تحديث الإحصائيات
    stats.value[0].value = totalCount || 0
    stats.value[1].value = completedCount || 0
    stats.value[2].value = inProgressCount || 0
    stats.value[3].value = formatCurrency(avgCost)
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}
const { data: avgData, error: avgError } = await supabase
  .from('maintenance_requests_archive')
  .select('AVG(actual_cost)', { head: true });
if (avgError) throw avgError;

const avgCost = avgData?.[0]?.avg || 0;
stats.value[3].value = formatCurrency(avgCost);
// تغيير الصفحة
const changePage = (page) => {
  currentPage.value = page
  fetchMaintenanceRequests()
}

// ترتيب الجدول
const sortTable = (column, direction) => {
  sortBy.value = { column, direction }
  fetchMaintenanceRequests()
}

// عرض تفاصيل الطلب
const viewDetails = (request) => {
  selectedRequest.value = request
  isDetailsModalOpen.value = true
}

// استعادة طلب من الأرشيف
const restoreRequest = async (request) => {
  try {
  // منطق استعادة الطلب
  isDetailsModalOpen.value = false;
  fetchMaintenanceRequests();
  useToast().add({
    title: 'تمت الاستعادة بنجاح',
    description: `تمت استعادة طلب الصيانة "${request.title}" بنجاح`,
    color: 'green',
  });
} catch (error) {
  console.error('Error restoring request:', error);
  useToast().add({
    title: 'خطأ في الاستعادة',
    description: 'حدث خطأ أثناء محاولة استعادة طلب الصيانة',
    color: 'red',
  });
}
    
    // إغلاق النافذة المنبثقة
    isDetailsModalOpen.value = false
    
    // إعادة تحميل البيانات
    fetchMaintenanceRequests()
    
    // عرض إشعار نجاح
    useToast().add({
      title: 'تمت الاستعادة بنجاح',
      description: `تمت استعادة طلب الصيانة "${request.title}" بنجاح`,
      color: 'green'
    })
  } catch (error) {
    console.error('Error restoring request:', error)
 
 <script setup>
import { ref, onMounted } from 'vue'

// مرجع لمحتوى الداشبورد
const dashboardContent = ref(null)

// وظيفة تحميل الداشبورد كملف PDF
const downloadAsPDF = async () => {
  // استيراد المكتبة بشكل ديناميكي (فقط عند الحاجة)
  const html2pdf = await import('html2pdf.js')
  
  // خيارات PDF
  const options = {
    margin: 10,
    filename: 'maintenance-dashboard.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  }
  
  // إنشاء PDF من محتوى الداشبورد
  html2pdf.default()
    .from(dashboardContent.value)
    .set(options)
    .save()
    .then(() => {
      // عرض إشعار نجاح
      useToast().add({
        title: 'تم التحميل بنجاح',
        description: 'تم تحميل الداشبورد كملف PDF',
        color: 'green'
      })
    })
    .catch(error => {
      console.error('Error generating PDF:', error)
      // عرض إشعار خطأ
      useToast().add({
        title: 'خطأ في التحميل',
        description: 'حدث خطأ أثناء تحميل الداشبورد',
        color: 'red'
      })
    })
}
  
    // عرض إشعار خطأ
    useToast().add({
      title: 'خطأ في الاستعادة',
      description: 'حدث خطأ أثناء محاولة استعادة طلب الصيانة',
      color: 'red'
    })
  }
}

// الحصول على عناصر قائمة الإجراءات
const getActionItems = (row) => {
  return [
    {
      label: 'عرض التفاصيل',
      icon: 'i-heroicons-eye',
      click: () => viewDetails(row)
    },
    {
      label: 'استعادة الطلب',
      icon: 'i-heroicons-arrow-path',
      click: () => restoreRequest(row)
    }
  ]
}

// دوال مساعدة
const formatDate = (dateString) => {
  if (!dateString) return 'غير متوفر';
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
}

const getStatusColor = (status) => {
  const statusColors = {
    pending: 'yellow',
    'in-progress': 'blue',
    completed: 'green',
    cancelled: 'red',
  };
  return statusColors[status] || 'gray';
};

const getPriorityColor = (priority) => {
  const priorityColors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  };
  return priorityColors[priority] || 'gray';
};

const getPriorityColor = (priority) => {
  const priorityColors = {
    'low': 'gray',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red'
  }
  return priorityColors[priority] || 'gray'
}

const getPriorityText = (priority) => {
  const priorityTexts = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة'
  }
  return priorityTexts[priority] || priority
}

// تحميل البيانات عند تحميل الصفحة
onMounted(() => {
  fetchMaintenanceRequests()
})
</script>ام البيانات مع الترتيب والصفحات
    .order(sortBy.value.column, { ascending: sortBy.value.direction === 'asc' })
      .range(from, to)
    
    if (error) {
      console.error('Error fetching maintenance requests:', error)
      return
    }
    
    maintenanceRequests.value = data || []
    
    // جلب الإحصائيات
    await fetchStats()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

// جلب الإحصائيات
const fetchStats = async () => {
  try {
    // إجمالي عدد الطلبات
    const { count: totalCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
    
    // عدد الطلبات المكتملة
    const { count: completedCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    
    // عدد الطلبات قيد التنفيذ
    const { count: inProgressCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress')
    
    // متوسط التكلفة الفعلية
    const { data: costData } = await supabase
      .from('maintenance_requests_archive')
      .select('actual_cost')
      .not('actual_cost', 'is', null)
    
    let avgCost = 0
    if (costData && costData.length > 0) {
      const sum = costData.reduce((acc, item) => acc + (parseFloat(item.actual_cost) || 0), 0)
      avgCost = sum / costData.length
    }
    
    // تحديث الإحصائيات
    stats.value[0].value = totalCount || 0
    stats.value[1].value = completedCount || 0
    stats.value[2].value = inProgressCount || 0
    stats.value[3].value = formatCurrency(avgCost)
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// تغيير الصفحة
const changePage = (page) => {
  currentPage.value = page
  fetchMaintenanceRequests()
}

// ترتيب الجدول
const sortTable = (column, direction) => {
  sortBy.value = { column, direction }
  fetchMaintenanceRequests()
}

// عرض تفاصيل الطلب
const viewDetails = (request) => {
  selectedRequest.value = request
  isDetailsModalOpen.value = true
}

// استعادة طلب من الأرشيف
const restoreRequest = async (request) => {
  try {
    // هنا يمكنك إضافة المنطق الخاص باستعادة الطلب من الأرشيف
    // على سبيل المثال، نقل البيانات من جدول الأرشيف إلى جدول الطلبات النشطة
    
    // إغلاق النافذة المنبثقة
    isDetailsModalOpen.value = false
    
    // إعادة تحميل البيانات
    fetchMaintenanceRequests()
    
    // عرض إشعار نجاح
    useToast().add({
      title: 'تمت الاستعادة بنجاح',
      description: `تمت استعادة طلب الصيانة "${request.title}" بنجاح`,
      color: 'green'
    })
  } catch (error) {
    console.error('Error restoring request:', error)
    
    // عرض إشعار خطأ
    useToast().add({
      title: 'خطأ في الاستعادة',
      description: 'حدث خطأ أثناء محاولة استعادة طلب الصيانة',
      color: 'red'
    })
  }
}

// الحصول على عناصر قائمة الإجراءات
const getActionItems = (row) => {
  return [
    {
      label: 'عرض التفاصيل',
      icon: 'i-heroicons-eye',
      click: () => viewDetails(row)
    },
    {
      label: 'استعادة الطلب',
      icon: 'i-heroicons-arrow-path',
      click: () => restoreRequest(row)
    }
  ]
}

// دوال مساعدة
const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
}

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'yellow',
    'in-progress': 'blue',
    'completed': 'green',
    'cancelled': 'red'
  }
  return statusColors[status] || 'gray'
}

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'قيد الانتظار',
    'in-progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  }
  return statusTexts[status] || status
}

const getPriorityColor = (priority) => {
  const priorityColors = {
    'low': 'gray',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red'
  }
  return priorityColors[priority] || 'gray'
}

const getPriorityText = (priority) => {
  const priorityTexts = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة'
  }
  return priorityTexts[priority] || priority
}

// تحميل البيانات عند تحميل الصفحة
onMounted(() => {
  fetchMaintenanceRequests()
})
</script>de
    .order(sortBy.value.column, { ascending: sortBy.value.direction === 'asc' })
      .range(from, to)
    
    if (error) {
      console.error('Error fetching maintenance requests:', error)
      return
    }
    
    maintenanceRequests.value = data || []
    
    // جلب الإحصائيات
    await fetchStats()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

// جلب الإحصائيات
const fetchStats = async () => {
  try {
    // إجمالي عدد الطلبات
    const { count: totalCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
    
    // عدد الطلبات المكتملة
    const { count: completedCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    
    // عدد الطلبات قيد التنفيذ
    const { count: inProgressCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress')
    
    // متوسط التكلفة الفعلية
    const { data: costData } = await supabase
      .from('maintenance_requests_archive')
      .select('actual_cost')
      .not('actual_cost', 'is', null)
    
    let avgCost = 0
    if (costData && costData.length > 0) {
      const sum = costData.reduce((acc, item) => acc + (parseFloat(item.actual_cost) || 0), 0)
      avgCost = sum / costData.length
    }
    
    // تحديث الإحصائيات
    stats.value[0].value = totalCount || 0
    stats.value[1].value = completedCount || 0
    stats.value[2].value = inProgressCount || 0
    stats.value[3].value = formatCurrency(avgCost)
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// تغيير الصفحة
const changePage = (page) => {
  currentPage.value = page
  fetchMaintenanceRequests()
}

// ترتيب الجدول
const sortTable = (column, direction) => {
  sortBy.value = { column, direction }
  fetchMaintenanceRequests()
}

// عرض تفاصيل الطلب
const viewDetails = (request) => {
  selectedRequest.value = request
  isDetailsModalOpen.value = true
}

// استعادة طلب من الأرشيف
const restoreRequest = async (request) => {
  try {
    // هنا يمكنك إضافة المنطق الخاص باستعادة الطلب من الأرشيف
    // على سبيل المثال، نقل البيانات من جدول الأرشيف إلى جدول الطلبات النشطة
    
    // إغلاق النافذة المنبثقة
    isDetailsModalOpen.value = false
    
    // إعادة تحميل البيانات
    fetchMaintenanceRequests()
    
    // عرض إشعار نجاح
    useToast().add({
      title: 'تمت الاستعادة بنجاح',
      description: `تمت استعادة طلب الصيانة "${request.title}" بنجاح`,
      color: 'green'
    })
  } catch (error) {
    console.error('Error restoring request:', error)
    
    // عرض إشعار خطأ
    useToast().add({
      title: 'خطأ في الاستعادة',
      description: 'حدث خطأ أثناء محاولة استعادة طلب الصيانة',
      color: 'red'
    })
  }
}

// الحصول على عناصر قائمة الإجراءات
const getActionItems = (row) => {
  return [
    {
      label: 'عرض التفاصيل',
      icon: 'i-heroicons-eye',
      click: () => viewDetails(row)
    },
    {
      label: 'استعادة الطلب',
      icon: 'i-heroicons-arrow-path',
      click: () => restoreRequest(row)
    }
  ]
}

// دوال مساعدة
const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
}

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'yellow',
    'in-progress': 'blue',
    'completed': 'green',
    'cancelled': 'red'
  }
  return statusColors[status] || 'gray'
}

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'قيد الانتظار',
    'in-progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  }
  return statusTexts[status] || status
}

const getPriorityColor = (priority) => {
  const priorityColors = {
    'low': 'gray',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red'
  }
  return priorityColors[priority] || 'gray'
}

const getPriorityText = (priority) => {
  const priorityTexts = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة'
  }
  return priorityTexts[priority] || priority
}

// تحميل البيانات عند تحميل الصفحة
onMounted(() => {
  fetchMaintenanceRequests()
})
</script>'')
    .order(sortBy.value.column, { ascending: sortBy.value.direction === 'asc' })
      .range(from, to)
    
    if (error) {
      console.error('Error fetching maintenance requests:', error)
      return
    }
    
    maintenanceRequests.value = data || []
    
    // جلب الإحصائيات
    await fetchStats()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

// جلب الإحصائيات
const fetchStats = async () => {
  try {
    // إجمالي عدد الطلبات
    const { count: totalCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
    
    // عدد الطلبات المكتملة
    const { count: completedCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    
    // عدد الطلبات قيد التنفيذ
    const { count: inProgressCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress')
    
    // متوسط التكلفة الفعلية
    const { data: costData } = await supabase
      .from('maintenance_requests_archive')
      .select('actual_cost')
      .not('actual_cost', 'is', null)
    
    let avgCost = 0
    if (costData && costData.length > 0) {
      const sum = costData.reduce((acc, item) => acc + (parseFloat(item.actual_cost) || 0), 0)
      avgCost = sum / costData.length
    }
    
    // تحديث الإحصائيات
    stats.value[0].value = totalCount || 0
    stats.value[1].value = completedCount || 0
    stats.value[2].value = inProgressCount || 0
    stats.value[3].value = formatCurrency(avgCost)
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// تغيير الصفحة
const changePage = (page) => {
  currentPage.value = page
  fetchMaintenanceRequests()
}

// ترتيب الجدول
const sortTable = (column, direction) => {
  sortBy.value = { column, direction }
  fetchMaintenanceRequests()
}

// عرض تفاصيل الطلب
const viewDetails = (request) => {
  selectedRequest.value = request
  isDetailsModalOpen.value = true
}

// استعادة طلب من الأرشيف
const restoreRequest = async (request) => {
  try {
    // هنا يمكنك إضافة المنطق الخاص باستعادة الطلب من الأرشيف
    // على سبيل المثال، نقل البيانات من جدول الأرشيف إلى جدول الطلبات النشطة
    
    // إغلاق النافذة المنبثقة
    isDetailsModalOpen.value = false
    
    // إعادة تحميل البيانات
    fetchMaintenanceRequests()
    
    // عرض إشعار نجاح
    useToast().add({
      title: 'تمت الاستعادة بنجاح',
      description: `تمت استعادة طلب الصيانة "${request.title}" بنجاح`,
      color: 'green'
    })
  } catch (error) {
    console.error('Error restoring request:', error)
    
    // عرض إشعار خطأ
    useToast().add({
      title: 'خطأ في الاستعادة',
      description: 'حدث خطأ أثناء محاولة استعادة طلب الصيانة',
      color: 'red'
    })
  }
}

// الحصول على عناصر قائمة الإجراءات
const getActionItems = (row) => {
  return [
    {
      label: 'عرض التفاصيل',
      icon: 'i-heroicons-eye',
      click: () => viewDetails(row)
    },
    {
      label: 'استعادة الطلب',
      icon: 'i-heroicons-arrow-path',
      click: () => restoreRequest(row)
    }
  ]
}

// دوال مساعدة
const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
}

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'yellow',
    'in-progress': 'blue',
    'completed': 'green',
    'cancelled': 'red'
  }
  return statusColors[status] || 'gray'
}

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'قيد الانتظار',
    'in-progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  }
  return statusTexts[status] || status
}

const getPriorityColor = (priority) => {
  const priorityColors = {
    'low': 'gray',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red'
  }
  return priorityColors[priority] || 'gray'
}

const getPriorityText = (priority) => {
  const priorityTexts = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة'
  }
  return priorityTexts[priority] || priority
}

// تحميل البيانات عند تحميل الصفحة
onMounted(() => {
  fetchMaintenanceRequests()
})
</script>t
    .order(sortBy.value.column, { ascending: sortBy.value.direction === 'asc' })
      .range(from, to)
    
    if (error) {
      console.error('Error fetching maintenance requests:', error)
      return
    }
    
    maintenanceRequests.value = data || []
    
    // جلب الإحصائيات
    await fetchStats()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

// جلب الإحصائيات
const fetchStats = async () => {
  try {
    // إجمالي عدد الطلبات
    const { count: totalCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
    
    // عدد الطلبات المكتملة
    const { count: completedCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    
    // عدد الطلبات قيد التنفيذ
    const { count: inProgressCount } = await supabase
      .from('maintenance_requests_archive')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-progress')
    
    // متوسط التكلفة الفعلية
    const { data: costData } = await supabase
      .from('maintenance_requests_archive')
      .select('actual_cost')
      .not('actual_cost', 'is', null)
    
    let avgCost = 0
    if (costData && costData.length > 0) {
      const sum = costData.reduce((acc, item) => acc + (parseFloat(item.actual_cost) || 0), 0)
      avgCost = sum / costData.length
    }
    
    // تحديث الإحصائيات
    stats.value[0].value = totalCount || 0
    stats.value[1].value = completedCount || 0
    stats.value[2].value = inProgressCount || 0
    stats.value[3].value = formatCurrency(avgCost)
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// تغيير الصفحة
const changePage = (page) => {
  currentPage.value = page
  fetchMaintenanceRequests()
}

// ترتيب الجدول
const sortTable = (column, direction) => {
  sortBy.value = { column, direction }
  fetchMaintenanceRequests()
}

// عرض تفاصيل الطلب
const viewDetails = (request) => {
  selectedRequest.value = request
  isDetailsModalOpen.value = true
}

// استعادة طلب من الأرشيف
const restoreRequest = async (request) => {
  try {
    // هنا يمكنك إضافة المنطق الخاص باستعادة الطلب من الأرشيف
    // على سبيل المثال، نقل البيانات من جدول الأرشيف إلى جدول الطلبات النشطة
    
    // إغلاق النافذة المنبثقة
    isDetailsModalOpen.value = false
    
    // إعادة تحميل البيانات
    fetchMaintenanceRequests()
    
    // عرض إشعار نجاح
    useToast().add({
      title: 'تمت الاستعادة بنجاح',
      description: `تمت استعادة طلب الصيانة "${request.title}" بنجاح`,
      color: 'green'
    })
  } catch (error) {
    console.error('Error restoring request:', error)
    
    // عرض إشعار خطأ
    useToast().add({
      title: 'خطأ في الاستعادة',
      description: 'حدث خطأ أثناء محاولة استعادة طلب الصيانة',
      color: 'red'
    })
  }
}

// الحصول على عناصر قائمة الإجراءات
const getActionItems = (row) => {
  return [
    {
      label: 'عرض التفاصيل',
      icon: 'i-heroicons-eye',
      click: () => viewDetails(row)
    },
    {
      label: 'استعادة الطلب',
      icon: 'i-heroicons-arrow-path',
      click: () => restoreRequest(row)
    }
  ]
}

// دوال مساعدة
const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount)
}

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'yellow',
    'in-progress': 'blue',
    'completed': 'green',
    'cancelled': 'red'
  }
  return statusColors[status] || 'gray'
}

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'قيد الانتظار',
    'in-progress': 'قيد التنفيذ',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  }
  return statusTexts[status] || status
}

const getPriorityColor = (priority) => {
  const priorityColors = {
    'low': 'gray',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red'
  }
  return priorityColors[priority] || 'gray'
}

const getPriorityText = (priority) => {
  const priorityTexts = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة'
  }
  return priorityTexts[priority] || priority
}

// تحميل البيانات عند تحميل الصفحة
onMounted(() => {
  fetchMaintenanceRequests()
})
const downloadAsPDF = async () => {
  const html2pdf = await import('html2pdf.js')
  
  // إنشاء نسخة من محتوى الداشبورد للطباعة
  const printContent = dashboardContent.value.cloneNode(true)
  
  // إزالة العناصر غير المطلوبة في PDF
  printContent.querySelectorAll('.no-print').forEach(el => el.remove())
  
  // إضافة ترويسة وتذييل
  const header = document.createElement('div')
  header.innerHTML = `<h1>تقرير أرشيف طلبات الصيانة</h1><p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>`
  printContent.prepend(header)
  
  // تحويل إلى PDF
  html2pdf.default()
    .from(printContent)
    .set(options)
    .save()
}
</script>

<style>
@media print {
  /* أنماط خاصة بالطباعة */
  .no-print {
    display: none !important;
  }
  
  /* تحسين مظهر الجداول */
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 8px;
    border: 1px solid #ddd;
  }
}
</style>
