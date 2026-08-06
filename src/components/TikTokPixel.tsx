interface TikTokPixelProps {
  pixelId: string;
}

const DEFERRED_LOAD_DELAY_MS = 2_000;

export default function TikTokPixel({ pixelId }: TikTokPixelProps) {
  return (
    <script
      id="tiktok-pixel"
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;
            e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

            var delayedLoadTimer=null;
            var delayedLoadListener=null;
            var pendingPageView=false;

            function hasTikTokClickId(){
              try{return new URLSearchParams(w.location.search).has('ttclid')}catch(e){return false}
            }
            function cancelDelayedLoad(){
              if(delayedLoadTimer!==null){w.clearTimeout(delayedLoadTimer);delayedLoadTimer=null}
              if(delayedLoadListener!==null){w.removeEventListener('load',delayedLoadListener);delayedLoadListener=null}
            }
            function loadTikTokPixel(){
              cancelDelayedLoad();
              if(!w.__tiktokTrackingEnabled||w.__tiktokPixelLoaded)return;
              ttq.load('${pixelId}');
              w.__tiktokPixelLoaded=true;
              if(pendingPageView){pendingPageView=false;ttq.page()}
            }
            function scheduleTikTokPixelLoad(){
              if(w.__tiktokPixelLoaded||delayedLoadTimer!==null||delayedLoadListener!==null)return;
              var startDelay=function(){
                delayedLoadListener=null;
                delayedLoadTimer=w.setTimeout(loadTikTokPixel,${DEFERRED_LOAD_DELAY_MS});
              };
              if(d.readyState==='complete')startDelay();
              else{delayedLoadListener=startDelay;w.addEventListener('load',startDelay,{once:true})}
            }

            w.__queueTikTokPageView=function(){
              if(!w.__tiktokTrackingEnabled)return;
              if(w.__tiktokPixelLoaded)ttq.page();
              else pendingPageView=true;
            };
            w.__enableTikTokPixel=function(loadImmediately){
              if(w.__tiktokTrackingEnabled){
                if(loadImmediately||hasTikTokClickId())loadTikTokPixel();
                return;
              }
              w.__tiktokTrackingEnabled=true;
              w.__queueTikTokPageView();
              if(loadImmediately||hasTikTokClickId())loadTikTokPixel();
              else scheduleTikTokPixelLoad();
            };
            w.__grantTikTokConsent=function(loadImmediately){
              ttq.grantConsent();
              w.__enableTikTokPixel(loadImmediately);
            };
            w.__revokeTikTokConsent=function(){
              w.__tiktokTrackingEnabled=false;
              pendingPageView=false;
              cancelDelayedLoad();
              ttq.revokeConsent();
            };

            try {
              var consentChoice = localStorage.getItem('consent_choice');
              if (consentChoice === 'accepted') w.__grantTikTokConsent();
              if (consentChoice === 'rejected') w.__revokeTikTokConsent();
            } catch(e) {}
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}
