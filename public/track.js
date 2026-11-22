// Central Florida Well Pros — first-party tracking (no third parties, no sod business)
window.dataLayer=window.dataLayer||[];
(function(){try{
 var ev={type:'pageview',page:location.pathname,ts:new Date().toISOString(),ref:document.referrer||''};
 window.dataLayer.push(ev);
 var k='cfwp_events';var a=JSON.parse(localStorage.getItem(k)||'[]');a.push(ev);localStorage.setItem(k,JSON.stringify(a.slice(-200)));
 if(navigator.sendBeacon){try{navigator.sendBeacon('/central-florida-well-pros/api/track',JSON.stringify(ev))}catch(e){}}
}catch(e){}})();
