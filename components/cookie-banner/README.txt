Consent Manager Installation Instructions

1. Extract the contents of this zip file
2. Place the files in your website directory
3. Add the following code to your HTML page, inside the <head> tag:

<link rel="stylesheet" id="silktide-consent-manager-css" href="path-to-css/silktide-consent-manager.css"> 
<script src="path-to-js/silktide-consent-manager.js"></script> 
<script> 
silktideCookieBannerManager.updateCookieBannerConfig({ 
  background: { 
    showBackground: true 
  }, 
  cookieIcon: { 
    position: "bottomLeft" 
  }, 
  cookieTypes: [ 
    { 
      id: "necessary", 
      name: "Necessary", 
      description: "<p>这些 cookie 对于网站正常运行是必需的，无法关闭。它们有助于登录和设置隐私偏好等操作。</p>", 
      required: true, 
      onAccept: function() { 
        console.log('在此处添加必需的 Necessary 的逻辑'); 
      } 
    }, 
    { 
      id: "analytics", 
      name: "Analytics", 
      description: "<p>这些 Cookie 通过跟踪哪些页面最受欢迎以及访问者如何在网站上浏览来帮助我们改进网站。</p>", 
      defaultValue: true, 
      onAccept: function() { 
        gtag('consent', 'update', { 
          analytics_storage: 'granted', 
        }); 
        dataLayer.push({ 
          'event': 'consent_accepted_analytics', 
        }); 
      }, 
      onReject: function() { 
        gtag('consent', 'update', { 
          analytics_storage: 'denied', 
        }); 
      } 
    }, 
    { 
      id: "advertising", 
      name: "广告", 
      description: "<p>这些 Cookie 提供额外的功能和个性化服务，以改善您的体验。它们可能由我们或我们使用的合作伙伴的服务设置。</p>", 
      onAccept: function() { 
        gtag('consent', 'update', { 
          ad_storage: 'granted', 
          ad_user_data: 'granted', 
          ad_personalization: 'granted', 
        }); 
        dataLayer.push({ 
          'event': 'consent_accepted_advertising', 
        }); 
      }, 
      onReject: function() { 
        gtag('consent', 'update', { 
          ad_storage: 'denied', 
          ad_user_data: 'denied',
          ad_personalization: 'denied', 
        }); 
      } 
    } 
  ], 
  text: { 
    banner: {
      description: "<p>我们在网站上使用 Cookie 来提升您的用户体验、提供个性化内容并分析网站流量。<a href=\"https://your-website.com/cookie-policy\" target=\"_blank\">Cookie 政策。</a></p>", 
      acceptAllButtonText: "全部接受", 
      acceptAllButtonAccessibleLabel: "接受所有 Cookie", 
      rejectNonEssentialButtonText: "拒绝非必要 Cookie", 
      rejectNonEssentialButtonAccessibleLabel: "拒绝非必要 Cookie", 
      preferencesButtonText: "偏好设置", 
      preferencesButtonAccessibleLabel: "切换偏好设置" 
    }, 
    preferences: { 
      title: "自定义您的 Cookie 偏好设置", 
      description: "<p>我们尊重您的隐私权。您可以选择不允许某些类型的 Cookie。您的 Cookie 偏好设置将应用于我们整个网站。</p>", 
      creditLinkText: "免费获取此横幅", 
      creditLinkAccessibleLabel: "免费获取此横幅" 
    } 
  } 
}); 
</script>
