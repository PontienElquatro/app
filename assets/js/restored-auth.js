/* Formulaires raccordés aux services dans les cartes d’authentification d’origine. */
(function(root){
  'use strict';
  const U=root.Monganga,A=root.MongangaApi,D=root.MongangaData;
  const {$,$$,esc}=U;
  const input=(name,label,type='text',extra='')=>`<div class="form-group"><label class="form-label" for="${name}">${label}</label><input class="form-input" id="${name}" name="${name}" type="${type}" ${extra}></div>`;
  const submit=label=>`${U.errorBox()}<button type="submit" class="btn btn-primary btn-lg btn-block">${label}</button>`;
  const title=(heading,subtitle='')=>`<h1 class="auth-title">${heading}</h1><p class="auth-subtitle">${subtitle}</p>`;
  function passwords(){
    $$('[data-password-target]').forEach(b=>b.onclick=()=>{
      const field=document.getElementById(b.dataset.passwordTarget),show=field.type==='password';field.type=show?'text':'password';b.setAttribute('aria-label',show?'Masquer le mot de passe':'Afficher le mot de passe');b.setAttribute('aria-pressed',String(show));b.innerHTML=U.icon(show?'eye-off':'eye');U.initLucide();
    });
  }
  root.checkPasswordStrength=(input,id)=>{
    const value=input.value,strength=Number(value.length>=8)+Number(/[A-Z]/.test(value))+Number(/[0-9]/.test(value))+Number(/[^A-Za-z0-9]/.test(value));
    $$('.password-strength-bar',document.getElementById(id)).forEach((bar,i)=>{bar.className='password-strength-bar';if(i<strength)bar.classList.add(strength<=2?'weak':strength===3?'medium':'strong');});
  };
  U.pages.login=async()=>{
    passwords();const api=A.isConfigured();$('.demo-hint').hidden=api;
    $$('[data-demo-id]').forEach(b=>b.onclick=()=>{
      const user=D.demoUsers().find(u=>u.id===b.dataset.demoId);if(!user)return;
      $('#loginEmail').value=user.email;$('#loginPassword').value='Demo1234';
      $$('[data-demo-id]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));$('#loginPassword').focus();
    });
    U.bindForm('login-form',async p=>{
      let credentials={identifier:p.email.trim(),password:p.password,remember:!!p.remember};
      if(!api){
        const key=p.email.trim().toLowerCase();
        const user=D.demoUsers().find(u=>(u.email&&u.email.toLowerCase()===key)||(u.phone&&u.phone===key)||(key==='aline@email.com'&&u.id==='patient-demo'));
        if(!user)throw Error('Choisissez un compte de démonstration avec les boutons ci-dessous.');
        credentials={demoId:user.id};
      }
      let session;
      try{session=await D.login(credentials);}catch(error){if(error.status===401)throw Error('Identifiant ou mot de passe incorrect.');throw error;}
      U.go(U.safeReturn(U.params().get('returnTo'),session.role));
    });
  };
  U.pages.register=async()=>{
    passwords();const tabs=$$('[data-auth-role]');
    const choose=tab=>{
      tabs.forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById('form-'+t.dataset.authRole).style.display=active?'block':'none';});
    };
    tabs.forEach((tab,i)=>{tab.onclick=()=>choose(tab);tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+1)%tabs.length];choose(next);next.focus();}};});
    if(!A.isConfigured())$('#form-patient .otp-notice span').textContent='Démo : le code de vérification sera affiché à l’étape suivante. Aucun SMS ne sera envoyé.';
    U.bindForm('register-form',async p=>{
      const challenge=await D.register({name:`${p.firstName.trim()} ${p.lastName.trim()}`,email:p.email.trim(),phone:p.phone.trim(),password:p.password,consent:p.consent});
      sessionStorage.setItem('monganga-challenge',JSON.stringify(challenge));U.go('auth/verify.html');
    });
  };
  U.pages.verify=async()=>{
    let challenge;try{challenge=JSON.parse(sessionStorage.getItem('monganga-challenge')||'null');}catch{}
    if(!challenge){U.render(`${title('Vérifier mon téléphone','Commencez par créer votre compte.')}<a href="register.html" class="btn btn-primary btn-lg btn-block">Créer un compte</a>`);return;}
    U.render(`${title('Vérifier mon téléphone','Saisissez le code de vérification à six chiffres.')}${A.isConfigured()?'':'<p class="notice">Code de démonstration : <strong>123456</strong>. Aucun SMS envoyé.</p>'}<form id="otp-form">${input('code','Code reçu','text','required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6"')}${submit('Valider mon numéro')}</form><p id="otp-countdown" class="auth-footer" role="status"></p><button class="btn btn-ghost btn-block" type="button" id="resend-code">Renvoyer le code</button>`);
    const cooldown=()=>{const value=Number(challenge.resendAt)||Date.parse(challenge.resendAt)||0,wait=Math.max(0,Math.ceil((value-Date.now())/1000));$('#resend-code').disabled=wait>0;$('#otp-countdown').textContent=wait?`Vous pourrez demander un nouveau code dans ${wait} s.`:'Vous pouvez demander un nouveau code.';};
    cooldown();const timer=setInterval(cooldown,1000);root.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
    U.bindForm('otp-form',async p=>{const s=await D.verify({...p,challengeId:challenge.challengeId});sessionStorage.removeItem('monganga-challenge');U.go(`${s.role}/dashboard.html`);});
    U.on('resend-code',async()=>{challenge=await D.resend({challengeId:challenge.challengeId});sessionStorage.setItem('monganga-challenge',JSON.stringify(challenge));U.toast(A.isConfigured()?'Un nouveau code a été demandé.':'Code de démonstration renouvelé : 123456.');setTimeout(cooldown,0);});
  };
  U.pages.forgot=async()=>{
    U.render(`${title('Mot de passe oublié ?','Recevez un lien pour choisir un nouveau mot de passe.')}<form id="forgot-form">${input('identifier','Email ou téléphone','text','required autocomplete="username" maxlength="254"')}${submit('Envoyer le lien')}</form>${A.isConfigured()?'':'<p class="auth-footer">L’envoi du lien nécessite le service de compte.</p>'}`);
    U.bindForm('forgot-form',async p=>{if(!A.isConfigured())throw Error('L’envoi du lien est indisponible en démonstration.');await A.request('/auth/forgot-password',{method:'POST',body:p});U.render(`${title('Demande prise en compte','Si un compte correspond à cet identifiant, vous recevrez un lien de réinitialisation.')}<a href="login.html" class="btn btn-primary btn-lg btn-block">Retour à la connexion</a>`);});
  };
  U.pages.reset=async()=>{
    const token=U.params().get('token');if(token)history.replaceState(null,'',location.pathname);
    U.render(`${title('Nouveau mot de passe','Choisissez un mot de passe pour votre compte.')}<form id="reset-form">${input('password','Nouveau mot de passe','password','required autocomplete="new-password" minlength="8" maxlength="128"')}${input('passwordConfirm','Confirmer le mot de passe','password','required autocomplete="new-password" maxlength="128"')}<p class="auth-subtitle">Minimum 8 caractères, avec majuscule et chiffre.</p>${submit('Enregistrer le mot de passe')}</form>`);
    U.bindForm('reset-form',async p=>{if(!token)throw Error('Lien invalide. Demandez un nouveau lien depuis la connexion.');if(p.password!==p.passwordConfirm||!/^(?=.*[A-Z])(?=.*\d).{8,128}$/.test(p.password))throw Error('Vérifiez le mot de passe et sa confirmation : 8 caractères minimum, une majuscule et un chiffre.');if(!A.isConfigured())throw Error('Service de compte indisponible en démonstration.');await A.request('/auth/reset-password',{method:'POST',body:{token,password:p.password}});U.go('auth/login.html');});
  };
})(window);
