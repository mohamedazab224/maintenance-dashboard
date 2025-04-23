<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-bold">نموذج طلب صيانة جديد</h2>
    </template>

    <UForm :schema="schema" :state="state" @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- عنوان الطلب -->
        <UFormField label="عنوان الطلب" name="title" required>
          <UInput v-model="state.title" placeholder="أدخل عنوان طلب الصيانة" />
        </UFormField>

        <!-- نوع الخدمة -->
        <UFormField label="نوع الخدمة" name="service_type" required>
          <USelect
            v-model="state.service_type"
            :options="serviceTypeOptions"
            placeholder="اختر نوع الخدمة"
          />
        </UFormField>

        <!-- الوصف -->
        <UFormField label="وصف الطلب" name="description" required class="col-span-1 md:col-span-2">
          <UTextarea
            v-model="state.description"
            placeholder="أدخل وصفًا تفصيليًا لطلب الصيانة"
            rows="4"
          />
        </UFormField>

        <!-- الأولوية -->
        <UFormField label="الأولوية" name="priority" required>
          <USelect
            v-model="state.priority"
            :options="priorityOptions"
            placeholder="اختر أولوية الطلب"
          />
        </UFormField>

        <!-- المتجر -->
        <UFormField label="المتجر" name="store_id" required>
          <USelect
            v-model="state.store_id"
            :options="storeOptions"
            placeholder="اختر المتجر"
          />
        </UFormField>

        <!-- التكلفة المقدرة -->
        <UFormField label="التكلفة المقدرة" name="estimated_cost">
          <UInputNumber
            v-model="state.estimated_cost"
            placeholder="أدخل التكلفة المقدرة"
            :min="0"
          />
        </UFormField>

        <!-- تاريخ الجدولة -->
        <UFormField label="تاريخ الجدولة" name="scheduled_date">
          <UDatePicker
            v-model="state.scheduled_date"
            :min-date="new Date()"
            placeholder="اختر تاريخ الجدولة"
          />
        </UFormField>

        <!-- الخدمة الرئيسية -->
        <UFormField label="الخدمة الرئيسية" name="primary_service_id">
          <USelect
            v-model="state.primary_service_id"
            :options="primaryServiceOptions"
            placeholder="اختر الخدمة الرئيسية"
          />
        </UFormField>

        <!-- تعيين إلى -->
        <UFormField label="تعيين إلى" name="assigned_to">
          <USelect
            v-model="state.assigned_to"
            :options="userOptions"
            placeholder="اختر الموظف المسؤول"
          />
        </UFormField>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <UButton type="button" color="gray" @click="resetForm">
          إعادة تعيين
        </UButton>
        <UButton type="submit" color="primary" :loading="isSubmitting">
          إرسال الطلب
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<script setup>
import { z } from 'zod'
import { ref, reactive } from 'vue'

// حالة النموذج
const state = reactive({
  title: '',
  description: '',
  service_type: '',
  priority: 'medium',
  store_id: '',
  estimated_cost: null,
  scheduled_date: null,
  primary_service_id: '',
  assigned_to: ''
})

// حالة التقديم
const isSubmitting = ref(false)

// مخطط التحقق باستخدام Zod
const schema = z.object({
  title: z.string().min(3, 'يجب أن يحتوي العنوان على 3 أحرف على الأقل'),
  description: z.string().min(10, 'يجب أن يحتوي الوصف على 10 أحرف على الأقل'),
  service_type: z.string().min(1, 'يرجى اختيار نوع الخدمة'),
  priority: z.string().min(1, 'يرجى اختيار الأولوية'),
  store_id: z.string().min(1, 'يرجى اختيار المتجر'),
  estimated_cost: z.number().nullable().optional(),
  scheduled_date: z.date().nullable().optional(),
  primary_service_id: z.string().optional(),
  assigned_to: z.string().optional()
})

// خيارات القوائم المنسدلة
const serviceTypeOptions = [
  { label: 'صيانة', value: 'maintenance' },
  { label: 'تجديد', value: 'renovation' },
  { label: 'تركيب', value: 'installation' },
  { label: 'فحص', value: 'inspection' }
]

const priorityOptions = [
  { label: 'منخفضة', value: 'low' },
  { label: 'متوسطة', value: 'medium' },
  { label: 'عالية', value: 'high' },
  { label: 'عاجلة', value: 'urgent' }
]

// جلب خيارات المتاجر من Supabase
const storeOptions = ref([])
const primaryServiceOptions = ref([])
const userOptions = ref([])

// جلب البيانات من Supabase
const supabase = useSupabaseClient()

onMounted(async () => {
  try {
    // جلب المتاجر
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
    
    if (stores) {
      storeOptions.value = stores.map(store => ({
        label: store.name,
        value: store.id
      }))
    }

    // جلب خدمات الصيانة
    const { data: services } = await supabase
      .from('maintenance_services')
      .select('id, name')
    
    if (services) {
      primaryServiceOptions.value = services.map(service => ({
        label: service.name,
        value: service.id
      }))
    }

    // جلب المستخدمين
    const { data: users } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
    
    if (users) {
      userOptions.value = users.map(user => ({
        label: `${user.first_name} ${user.last_name}`,
        value: user.id
      }))
    }
  } catch (error) {
    console.error('Error fetching options:', error)
  }
})

// إعادة تعيين النموذج
const resetForm = () => {
  Object.keys(state).forEach(key => {
    if (key === 'priority') {
      state[key] = 'medium'
    } else {
      state[key] = typeof state[key] === 'number' ? null : ''
    }
  })
}

// معالجة تقديم النموذج
const onSubmit = async (event) => {
  isSubmitting.value = true
  
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        title: state.title,
        description: state.description,
        service_type: state.service_type,
        priority: state.priority,
        store_id: state.store_id,
        estimated_cost: state.estimated_cost,
        scheduled_date: state.scheduled_date,
        primary_service_id: state.primary_service_id || null,
        assigned_to: state.assigned_to || null,
        status: 'pending',
        created_by: supabase.auth.user()?.id
      })
      .select()
    
    if (error) throw error
    
    // عرض إشعار نجاح
    useToast().add({
      title: 'تم إنشاء الطلب بنجاح',
      description: `تم إنشاء طلب الصيانة "${state.title}" بنجاح`,
      color: 'green'
    })
    
    // إعادة تعيين النموذج
    resetForm()
  } catch (error) {
    console.error('Error submitting form:', error)
    
    // عرض إشعار خطأ
    useToast().add({
      title: 'خطأ في إنشاء الطلب',
      description: error.message || 'حدث خطأ أثناء إنشاء طلب الصيانة',
      color: 'red'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
