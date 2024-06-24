/****************************************************
*  original author: horans@gmail.com                *
*  url: github.com/horans/pardot-form-ajax-handler  *
*  modified for Sawyer                              *
****************************************************/

/* global $ grecaptcha */
/* eslint no-var: 0 */

// namespace
var pfah = {}

// get script path
pfah.gcp = function (name) {
  var cs = document.currentScript
  var cl
  if (cs) {
    cl = cs.src
  } else {
    var ss = document.querySelectorAll('script[src' + (name ? ('*="' + name + '"') : '') + ']')
    cs = ss[ss.length - 1]
    cl = cs.getAttribute.length === undefined ? cs.getAttribute('src', -1) : cs.src
  }
  return cl.substring(0, cl.lastIndexOf('/') + 1)
}
pfah.path = pfah.gcp('pardot-form.js')

// load asset
pfah.asset = function (type, asset) {
  if (type !== 'vendor') type = 'style'
  if ($('head #' + type + '-' + asset).length === 0) {
    var a = document.createElement(type === 'vendor' ? 'script' : 'link')
    a.id = type + '-' + asset
    if (type === 'vendor') {
      a.src = pfah.path + 'vendor/' + asset + '.js'
    } else {
      a.rel = 'stylesheet'
      a.href = pfah.path + 'pardot-form' + (asset === 'pfah' ? '' : ('-' + asset)) + '.css'
    }
    document.getElementsByTagName('head')[0].appendChild(a)
    if (type === 'vendor') {
      $('body').trigger('pfah.vendor', asset)
    }
  }
}

// set value
pfah.remember = function () {
  $('.pfah-input').each(function () {
    if ($(this).closest('.pfah-wrapper').data('remember') !== 'no') {
      if ($(this).attr('type') !== 'submit'){
        $(this).val(window.localStorage.getItem('pfah-' + $(this).attr('name')))
      }
    }
  })
}

// recaptcha
pfah.recaptcha = {
  active: false,
  load: false,
  check: ''
}

// initialize
pfah.init = function () {
  if ($('.pfah-wrapper').length > 0) {
    var n = $('.pfah-wrapper:last').data('style') === 'no'
    // default style
    if (!n) pfah.asset('style', 'pfah')
    // all forms
    $('.pfah-wrapper').each(function () {
      // customize theme
      if (!n) {
        var t = $(this).data('theme')
        if (t) pfah.asset('style', t.toLowerCase())
      }
      // check form link
      var p = $(this).find('.pfah-form').attr('action')
      if (p.indexOf('go.hisawyer.com') < 0) {
        $(this).trigger('pfah.notpardot')
          .find('[type="submit"]').attr('disabled', 'disabled')
        window.console.log('[pfah] not a pardot form')
      } else {
        // add source track
        var s = $(this).data('source')
        if (s && $(this).find('.pfah-form').find('[name="' + s + '"]').length === 0) {
          $(this).find('.pfah-form').prepend('<input type="hidden" name="' + s + '" value="' + window.location.href + '" />')
        }
        // add id
        var i = p.substring(p.lastIndexOf('/') + 1)
        $(this).attr('data-id', 'pfah-' + i)
        // load state
        var l = window.localStorage.getItem('pfah-' + i)
        if (l) $(this).addClass('pfah-result-' + l)
        $(this).trigger('pfah.ready', $(this).attr('data-id'))
      }
      // add recaptcha
      if ($(this).data('recaptcha')) {
        $(this).find('[type="submit"]').before('<div class="g-recaptcha" data-sitekey="' + $(this).data('recaptcha') + '"></div>')
        pfah.recaptcha.active = true
      }
    })
    // load recaptcha
    if (pfah.recaptcha.active && !pfah.recaptcha.load) {
      $.getScript('https://www.google.com/recaptcha/api.js')
      pfah.recaptcha.load = true
    }
  }
  // popup
  if ($('.pfah-popup').length > 0) pfah.asset('vendor', 'jquery.bpopup.min')
  // debounce
  if ($('.pfah-wrapper[data-remember="no"]').length < $('.pfah-wrapper').length) pfah.asset('vendor', 'jquery.ba-throttle-debounce.min')
  // set value
  pfah.remember()
}

// form state
pfah.form = {
  id: '',
  load: false
}

// callback
pfah.callback = function (res) {
  $('[data-id="' + pfah.form.id + '"]:first').trigger('pfah.callback', [pfah.form.id, res.result])
  window.console.log('[pfah] callback ' + res.result)
}

// popup
pfah.popup = function (tar) {
  tar.trigger('pfah.callpopup')
}

// document ready
$(function () {
  // initialize
  pfah.init()
  pageLoadedTime = new Date(performance.timing.domContentLoadedEventEnd);
  // submit form
  $('body').on('submit', '.pfah-wrapper', function (e) {
    e.preventDefault()
    if ($(this).data('recaptcha')) {
      pfah.recaptcha.check = grecaptcha.getResponse()
    }
    if (!pfah.form.load && ($(this).data('recaptcha') ? pfah.recaptcha.check : true)) {
      pfah.recaptcha.check = ''
      pfah.form.id = $(this).data('id')
      // check required checkbox
      var c = $(this).find('.pfah-check-required')
      if (c.length > 0 && c.length !== c.filter(':checked').length) {
        pfah.callback({ result: 'error' })
      } else {
        pfah.form.load = true
        var f = $(this).find('.pfah-form');
        var formEl = $(this).children('form')[0];
        var submitBtn = $(f).find('input[type="submit"]');
        var btnLoadtext = $(submitBtn).attr('data-wait');
        // Change button text to loading text on submit
        $(submitBtn).val(btnLoadtext);
        const timeEnd = new Date();
        const timeDiff = timeEnd - pageLoadedTime;
        if (timeDiff >= 1000) {
            Cookies.remove("is_potential_bot", { domain: "hisawyer.com" });
        } else {
            Cookies.set("is_potential_bot", true, { domain: "hisawyer.com", expires: 365 });
            return false;
        }
        // check h0neyp0t field
        var x = $(f).find('.pardot_extra_field').val();
        var y = $(f).find('.utm_extra').val();
        var usour = $(f).find('.utm_source').val();
        var ahid = $(f).find('.ahoy-visit-id').val();
        var formValid = formEl.checkValidity();
        // check email for blocked domains
        const domains = ["putrajayabaya.skom.id", "rhyta.com", "skom.id", "uma3.be", "jmlocal.com", "gml.com", "gojek.com", "upseotop.com", "mailinator.com", "genin88.com"];
        const regex = new RegExp(/\.id$/);
        const rejectDomain = domains.some(function(domain) {
          const userInputtedEmail = $(f).find('input[name="Email"').val();
          const reject1 = userInputtedEmail.includes(domain);
          const reject2 = regex.test(userInputtedEmail);
          return reject1 || reject2;
        });
        function isEmpty(value) {
          return (value == null || (typeof value === "string" && value.trim().length === 0));
        }
        // Check if AhoyID matches utm_source or if domain is blocked
        if (((isEmpty(ahid) == false) && (ahid === usour )) || (rejectDomain)) {
          // Block invalid domains and set b0t cookie
          console.log(ahid);
          console.log(usour);
          Cookies.set("is_potential_bot", true, { domain: "hisawyer.com", expires: 365 });
          return false;
          $(f).find('[type="submit"]').attr('disabled', 'disabled');
          // Submit form if valid and no h0neyp0t
        } else if ((x == "" || x == null) && (y == "" || y == null)) {
            if ( formValid ) {
            $(f).find('[type="submit"]').attr('disabled', 'disabled')
            window.console.log('[pfah] form submit')
            $(this).trigger('pfah.submit', pfah.form.id)
            // stackoverflow.com/questions/47047487/
            $.ajax({
              url: f.attr('action'),
              method: 'POST',
              data: f.serialize(),
              dataType: 'jsonp'
            });
          } else {
            pfah.callback({ result: 'error' });
          }
        } else if ((isEmpty(x) == false) || (isEmpty(y) == false)) {
            Cookies.set("is_potential_bot", true, { domain: "hisawyer.com", expires: 365 });
            return false;
            $(f).find('[type="submit"]').attr('disabled', 'disabled');
        } else {
          Cookies.set("is_potential_bot", true, { domain: "hisawyer.com", expires: 365 });
          pfah.callback({ result: 'error' });
          return false;
        }
      }
    }
  })

  // callback handler
  $('body').on('pfah.callback', function (e, id, result) {
    var s = $('[data-id="' + id + '"]').data('state')
    if (s && (s.toLowerCase() === result || s.toLowerCase() === 'all')) window.localStorage.setItem(pfah.form.id, result)
    $('[data-id="' + pfah.form.id + '"]').removeClass('pfah-result-error pfah-result-done').addClass('pfah-result-' + result)
      .find('[type="submit"]').removeAttr('disabled')
    pfah.form.id = ''
    pfah.form.load = false
  })

  // close error message
  $('body').on('click', '.pfah-error', function () {
    var f = $(this).closest('.pfah-wrapper')
    f.removeClass('pfah-result-error')
    window.localStorage.removeItem(f.data('id'))
  })

  // open popup
  $('body').on('click pfah.callpopup', '[data-toggle="pfah-popup"]', function () {
    var t = $(this).data('target')
    if (t) {
      var f = $(t).find('.pfah-wrapper')
      if (f.length > 0) {
        $(t).bPopup({
          closeClass: 'pfah-close',
          onOpen: function () {
            f.trigger('pfah.popup', [f.attr('data-id'), 'open'])
          },
          onClose: function () {
            f.trigger('pfah.popup', [f.attr('data-id'), 'close'])
          }
        })
      }
    }
  })

  // close popup with delay
  $('body').on('click', '.pfah-close-delay', function () {
    var t = $(this)
    setTimeout(function () {
      t.closest('.pfah-popup').find('.pfah-close').click()
    }, 200)
  })
})

// remeber inputs
$('body').on('pfah.vendor', function (e, asset) {
  if (asset === 'jquery.ba-throttle-debounce') {
    var cb = setInterval(function () {
      if (typeof $.debounce === 'function') {
        clearInterval(cb)
        $('body').on('change paste keyup', '.pfah-input', $.debounce(700, function () {
          if ($(this).closest('.pfah-wrapper').data('remember') !== 'no') {
            window.localStorage.setItem('pfah-' + $(this).attr('name'), $(this).val())
            pfah.remember()
          }
        }))
      }
    }, 100)
  }
})
