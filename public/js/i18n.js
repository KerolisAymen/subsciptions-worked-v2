// نظام الترجمة للغة العربية
const i18n = {
  currentLocale: 'ar',
  
  translations: {
    ar: {
      // ترجمة العناصر المشتركة
      common: {
        addMember: 'إضافة عضو',
        contact : 'جهة الاتصال' ,
        description: 'الوصف',
        loading: 'جاري التحميل...',
        save: 'حفظ',
        cancel: 'إلغاء',
        close: 'إغلاق',
        edit: 'تعديل',
        delete: 'حذف',
        view: 'عرض',
        add: 'إضافة',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        actions: 'إجراءات',
        required: 'هذا الحقل مطلوب',
        success: 'تم بنجاح',
        error: 'خطأ',
        warning: 'تحذير',
        info: 'معلومات',
        notification: 'إشعار',
        noData: 'لا توجد بيانات',
        home: 'الرئيسية',
        search: 'بحث',
        welcome: 'مرحباً',
        confirmDelete: 'هل أنت متأكد من الحذف؟',
        yes: 'نعم',
        no: 'لا',
        back: 'رجوع',
        next: 'التالي',
        logOut: 'تسجيل الخروج',
        profile: 'الملف الشخصي',
        balance: 'الرصيد',
        total: 'المجموع',
        role: 'الدور',
        overview: 'نظرة عامة', // Added missing key
        tableView: 'عرض الجدول',
        cardView: 'عرض البطاقات'
      },

      // ترجمة صفحة الرئيسية
      landing: {
        title: 'مُحصل - منصة تحصيل المدفوعات وتجميع الاشتراكات',
        subtitle: 'مُحصل هو منصة متكاملة لإدارة وتحصيل المدفوعات وتجميع الاشتراكات للمشاريع والمجموعات والمنظمات. سهّل جمع الأموال والاشتراكات، وتتبع المدفوعات، ونظّم المشاركين والمحصلين بسهولة وفعالية.',
        getStarted: 'ابدأ الآن',
        login: 'تسجيل الدخول',
        features: {
          manage: 'إدارة المشاركين',
          manageDesc: 'إضافة وإدارة المشاركين في المشروع أو المجموعة بسهولة، تحديد المبالغ أو الاشتراكات المتوقعة، وتتبع المدفوعات.',
          track: 'تتبع المدفوعات والاشتراكات',
          trackDesc: 'تسجيل مدفوعات واشتراكات المشاركين، تعيين المحصلين، والاحتفاظ بسجل كامل للمدفوعات والاشتراكات.',
          reports: 'توليد التقارير',
          reportsDesc: 'الحصول على تقارير مفصلة عن تقدم التحصيل وتجميع الاشتراكات والأرصدة المتبقية وملخصات المحصلين.'
        }
      },

      // ترجمة واجهة تسجيل الدخول
      auth: {
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        name: 'الاسم',
        forgotPassword: 'نسيت كلمة المرور؟',
        noAccount: 'ليس لديك حساب؟',
        hasAccount: 'لديك حساب بالفعل؟',
        createAccount: 'إنشاء حساب',
        signIn: 'تسجيل الدخول',
        loginSuccess: 'تم تسجيل الدخول بنجاح',
        signupSuccess: 'تم إنشاء الحساب بنجاح',
        loginError: 'فشل تسجيل الدخول',
        signupError: 'فشل إنشاء الحساب',
        logoutSuccess: 'تم تسجيل الخروج بنجاح',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        passwordMinLength: 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل'
      },

      // ترجمة واجهة المشاريع
      projects: {
        title: 'المشاريع',
        myProjects: 'مشاريعي',
        newProject: 'مشروع جديد',
        projectName: 'اسم المشروع',
        description: 'الوصف',
        noDescription: 'بدون وصف',
        noProjects: 'ليس لديك أي مشاريع بعد. أنشئ واحداً للبدء!',
        createProject: 'إنشاء مشروع',
        projectCreated: 'تم إنشاء المشروع بنجاح',
        viewProject: 'عرض المشروع',
        projectDetails: 'تفاصيل المشروع',
        projectStats: 'إحصائيات المشروع',
        trips: 'الرحلات',
        tripCount: 'عدد الرحلات',
        totalExpected: 'إجمالي المتوقع',
        totalCollected: 'إجمالي المحصل',
        remaining: 'المتبقي',
        recentActivity: 'النشاط الأخير',
        collector: 'المحصل',
        collectors: 'المحصلين',
        collectorSummary: 'ملخص المحصلين',
        totalCollected: 'إجمالي المحصل',
        noTrips: 'لا توجد رحلات بعد',
        members: 'الأعضاء',
        member: 'عضو',
        addMember: 'إضافة عضو',
        memberRole: 'دور العضو',
        owner: 'مالك',
        admin: 'مدير',
        collector: 'محصل',
        changeRole: 'تغيير الدور',
        removeMember: 'إزالة العضو',
        memberAdded: 'تمت إضافة العضو بنجاح',
        memberRemoved: 'تمت إزالة العضو بنجاح',
        roleUpdated: 'تم تحديث الدور بنجاح',
        noMembers: 'لا يوجد أعضاء بعد',
        reports: 'التقارير',
        collectionSummary: 'ملخص التحصيل',
        collectorDistribution: 'توزيع المحصلين',
        tripProgress: 'تقدم الرحلات'
      },

      // ترجمة واجهة الرحلات
      trips: {
        title: 'الرحلات',
        projectTrips: 'رحلات المشروع',
        newTrip: 'رحلة جديدة',
        tripName: 'اسم الرحلة',
        startDate: 'تاريخ البداية',
        endDate: 'تاريخ النهاية',
        totalCost: 'التكلفة الإجمالية',
        createTrip: 'إنشاء رحلة',
        tripCreated: 'تم إنشاء الرحلة بنجاح',
        viewTrip: 'عرض الرحلة',
        editTrip: 'تعديل الرحلة',
        deleteTrip: 'حذف الرحلة',
        tripDetails: 'تفاصيل الرحلة',
        expected: 'المتوقع',
        collected: 'المحصل',
        progress: 'التقدم',
        noTrips: 'لا توجد رحلات بعد',
        backToProject: 'العودة للمشروع',
        expectedAmountPerPerson: 'المبلغ المتوقع للشخص'
      },

      // ترجمة واجهة المشاركين
      participants: {
        createdBy: 'تم الإنشاء بواسطة',
        updatedBy: 'تم التحديث بواسطة',
        title: 'المشاركون',
        newParticipant: 'مشارك جديد',
        participantName: 'اسم المشارك',
        participantEmail: 'بريد المشارك الإلكتروني',
        participantPhone: 'رقم هاتف المشارك',
        expectedAmount: 'المبلغ المتوقع',
        addParticipant: 'إضافة مشارك',
        participantAdded: 'تمت إضافة المشارك بنجاح',
        participantDeleted: 'تم حذف المشارك بنجاح',
        contact: 'بيانات الاتصال',
        paidAmount: 'المبلغ المدفوع',
        viewParticipant: 'عرض المشارك',
        editParticipant: 'تعديل المشارك',
        deleteParticipant: 'حذف المشارك',
        noParticipants: 'لا يوجد مشاركين بعد',
        participantDetails: 'تفاصيل المشارك',
        paymentHistory: 'سجل المدفوعات',
        noPaymentHistory: 'لا يوجد سجل مدفوعات',
        paid: 'تم الدفع',
        unpaid: 'غير مدفوع',
        balance: 'الرصيد المتبقي',
        totalPaid: 'إجمالي المدفوع'
      },

      // ترجمة واجهة المدفوعات
      payments: {
        title: 'المدفوعات',
        newPayment: 'دفعة جديدة',
        recordPayment: 'تسجيل دفعة',
        paymentDate: 'تاريخ الدفع',
        amount: 'المبلغ',
        notes: 'ملاحظات',
        participant: 'المشارك',
        collector: 'المحصل',
        selectParticipant: 'اختر المشارك',
        pay: 'دفع',
        savePayment: 'حفظ الدفعة',
        paymentAdded: 'تمت إضافة الدفعة بنجاح',
        paymentDeleted: 'تم حذف الدفعة بنجاح',
        editPayment: 'تعديل الدفعة',
        deletePayment: 'حذف الدفعة',
        noPayments: 'لا توجد مدفوعات بعد',
        paymentStatus: 'حالة الدفع',
        paymentSummary: 'ملخص المدفوعات',
        paid: 'مدفوع',
        unpaid: 'غير مدفوع',
        add: 'إضافة دفعة',
        close: 'إغلاق'
      },

      // ترجمة واجهة التقارير
      reports: {
        title: 'التقارير',
        tripReport: 'تقرير الرحلة',
        projectReport: 'تقرير المشروع',
        paymentSummary: 'ملخص المدفوعات',
        collectorSummary: 'ملخص المحصلين',
        paymentStatus: 'حالة الدفع',
        noData: 'لا توجد بيانات للعرض',
        totalExpected: 'إجمالي المتوقع',
        totalCollected: 'إجمالي المحصل',
        totalRemaining: 'إجمالي المتبقي',
        remaining: 'المتبقي',
        percentComplete: 'نسبة الاكتمال',
        noCollectorData: 'لا توجد بيانات محصلين',
        noPaymentData: 'لا توجد مدفوعات مسجلة',
        completion: 'نسبة الإنجاز',
        percentage: 'النسبة',
        detailedCollectorSummary: 'تفاصيل تحصيل المحصلين',
        participantPaymentStatus: 'حالة دفع المشاركين',
        paymentTimeline: 'جدول المدفوعات الزمني',
        dailyCollection: 'المدفوعات اليومية',
        cumulativeCollection: 'إجمالي المدفوعات التراكمي',
        dailyAmount: 'المبلغ اليومي',
        cumulativeAmount: 'المبلغ التراكمي',
        monthlyTrend: 'الاتجاه الشهري للتحصيل',
        collectorDistribution: 'توزيع المحصلين'
      },

      // ترجمة رسائل الخطأ
      errors: {
        pageNotFound: 'الصفحة غير موجودة',
        pageNotFoundDesc: 'الصفحة التي تبحث عنها غير موجودة.',
        goHome: 'العودة للرئيسية',
        serverError: 'خطأ في الخادم',
        networkError: 'خطأ في الاتصال بالشبكة. الرجاء المحاولة لاحقاً.',
        unauthorized: 'غير مصرح لك بالوصول',
        sessionExpired: 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.',
        invalidCredentials: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
        requiredField: 'هذا الحقل مطلوب',
        invalidEmail: 'بريد إلكتروني غير صالح',
        shortPassword: 'كلمة المرور قصيرة جداً',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        userNotFound: 'المستخدم غير موجود',
        emailInUse: 'البريد الإلكتروني مستخدم بالفعل',
        projectCreateError: 'فشل إنشاء المشروع. الرجاء المحاولة مرة أخرى.',
        memberAddError: 'فشل إضافة العضو. تأكد من وجود المستخدم وأنه ليس عضواً بالفعل.',
        tripCreateError: 'فشل إنشاء الرحلة. الرجاء المحاولة مرة أخرى.',
        participantAddError: 'فشل إضافة المشارك. الرجاء المحاولة مرة أخرى.',
        paymentAddError: 'فشل إضافة الدفعة. الرجاء المحاولة مرة أخرى.'
      },

      // ترجمة أسماء الصفحات
      pages: {
        home: 'الرئيسية',
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
        projects: 'المشاريع',
        projectDetails: 'تفاصيل المشروع',
        trips: 'الرحلات',
        tripDetails: 'تفاصيل الرحلة',
        participants: 'المشاركين',
        payments: 'المدفوعات',
        reports: 'التقارير',
        notFound: 'صفحة غير موجودة'
      }
    }
  },

  // دالة للحصول على ترجمة
  t(key) {
    // تقسيم المفتاح، مثال: "common.save" أو "auth.login"
    const parts = key.split('.');
    if (parts.length !== 2) return key;

    const section = parts[0];
    const term = parts[1];
    
    // الحصول على الترجمة من القسم المطلوب
    const translations = this.translations[this.currentLocale];
    if (!translations) return key;
    
    const sectionTranslations = translations[section];
    if (!sectionTranslations) return key;
    
    // إرجاع الترجمة أو المفتاح الأصلي إذا لم تتوفر الترجمة
    return sectionTranslations[term] || key;
  },
  
  // دالة لتنسيق العملة بالريال السعودي
  formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },
  
  // دالة لتنسيق التاريخ باللغة العربية
  formatDate(dateString) {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  },
  
  // دالة لتنسيق النسبة المئوية
  formatPercent(value) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value / 100);
  }
};
