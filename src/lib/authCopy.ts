export const authCopy:Record<string,string[]>={
 en:['Staff sign-in','Sign in with your authorised staff account.','Email','Password','Cancel','Please wait…','Sign-in is unavailable. Please try again later.','Check your email and password and try again.','This account does not have content-management permission.'],
 tr:['Yetkili girişi','Yetkili personel hesabınızla giriş yapın.','E-posta','Şifre','Vazgeç','Lütfen bekleyin…','Giriş hizmeti şu anda kullanılamıyor. Daha sonra tekrar deneyin.','E-posta ve şifrenizi kontrol edip yeniden deneyin.','Bu hesabın içerik yönetimi yetkisi bulunmuyor.'],
 de:['Mitarbeiter-Anmeldung','Melden Sie sich mit Ihrem berechtigten Mitarbeiterkonto an.','E-Mail','Passwort','Abbrechen','Bitte warten…','Anmeldung derzeit nicht verfügbar. Bitte später versuchen.','E-Mail und Passwort prüfen und erneut versuchen.','Dieses Konto hat keine Berechtigung zur Inhaltsverwaltung.'],
 fr:['Connexion du personnel','Connectez-vous avec votre compte autorisé.','E-mail','Mot de passe','Annuler','Veuillez patienter…','La connexion est indisponible. Réessayez plus tard.','Vérifiez votre e-mail et votre mot de passe, puis réessayez.','Ce compte ne peut pas gérer les contenus.'],
 es:['Acceso del equipo','Inicia sesión con tu cuenta de personal autorizada.','Correo electrónico','Contraseña','Cancelar','Espera…','El acceso no está disponible. Inténtalo más tarde.','Comprueba el correo y la contraseña e inténtalo de nuevo.','Esta cuenta no tiene permiso para gestionar contenidos.'],
 ar:['دخول الموظفين','سجّل الدخول بحساب الموظف المخول.','البريد الإلكتروني','كلمة المرور','إلغاء','يرجى الانتظار…','خدمة الدخول غير متاحة الآن. حاول لاحقًا.','تحقق من البريد وكلمة المرور ثم حاول مجددًا.','لا يملك هذا الحساب صلاحية إدارة المحتوى.'],
 ru:['Вход для сотрудников','Войдите с помощью уполномоченной учётной записи.','Электронная почта','Пароль','Отмена','Подождите…','Вход сейчас недоступен. Попробуйте позже.','Проверьте почту и пароль и попробуйте снова.','У этой учётной записи нет прав на управление контентом.'],
 zh:['工作人员登录','请使用获得授权的工作人员账户登录。','邮箱','密码','取消','请稍候…','登录服务暂不可用，请稍后重试。','请检查邮箱和密码后重试。','此账户没有内容管理权限。'],
};
export const accessRecoveryCopy:Record<string,{error:string;retry:string;signOut:string;signOutError:string}>={
  tr:{error:'Hesabın yönetim yetkisi kontrol edilemedi.',retry:'Tekrar kontrol et',signOut:'Oturumu kapat',signOutError:'Oturum kapatılamadı. Yeniden deneyin.'},
  en:{error:'We could not check your staff access.',retry:'Check again',signOut:'Sign out',signOutError:'Could not sign out. Please try again.'},
  de:{error:'Ihre Zugriffsrechte konnten nicht geprüft werden.',retry:'Erneut prüfen',signOut:'Abmelden',signOutError:'Abmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'},
  fr:{error:'Vos droits d’accès n’ont pas pu être vérifiés.',retry:'Réessayer',signOut:'Se déconnecter',signOutError:'La déconnexion a échoué. Veuillez réessayer.'},
  es:{error:'No se pudo verificar tu acceso al panel.',retry:'Volver a comprobar',signOut:'Cerrar sesión',signOutError:'No se pudo cerrar la sesión. Inténtalo de nuevo.'},
  ar:{error:'تعذّر التحقق من صلاحية دخولك إلى لوحة الإدارة.',retry:'إعادة التحقق',signOut:'تسجيل الخروج',signOutError:'تعذّر تسجيل الخروج. حاول مجددًا.'},
  ru:{error:'Не удалось проверить ваши права доступа.',retry:'Проверить ещё раз',signOut:'Выйти',signOutError:'Не удалось выйти. Попробуйте ещё раз.'},
  zh:{error:'无法验证您的管理权限。',retry:'重新检查',signOut:'退出登录',signOutError:'未能退出登录，请重试。'},
};
