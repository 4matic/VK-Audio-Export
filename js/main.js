$(window).load(function() {
    $("#preloader").fadeOut("slow");
    $(".logo-heading").addClass("logo-heading-top");
    $('.init-slider').owlCarousel({
        items:1,
        merge:true,
        autoHeight: true,
        loop:true,
        video:true,
        smartSpeed: 600
        
    });

});

$(document).ready(function(){

    wow = new WOW({
        mobile:       false,       // default
      }
    )
    wow.init();

     $('#top-nav').onePageNav({
        currentClass: 'current',
        changeHash: true,
        scrollSpeed: 1200
    });

     
    //animated header class
    $(window).scroll(function () {
        if ($(window).scrollTop() > 100) {
            $(".logo-heading").removeClass("logo-heading-top");
            $(".navbar-default").addClass("animated");
            
        } else {
            $(".navbar-default").removeClass('animated');
            $(".logo-heading").addClass("logo-heading-top");
        }
    });

    $('#countdown_dashboard').countDown({
        targetDate: {
            'day':      16,
            'month':    12,
            'year':     2016,
            'hour':     00,
            'min':      00,
            'sec':      01,
        },
        omitWeeks: true
    });


    /*$('input, textarea').data('holder', $('input, textarea').attr('placeholder'));

    $('input, textarea').focusin(function () {
        $(this).attr('placeholder', '');
    });
    $('input, textarea').focusout(function () {
        $(this).attr('placeholder', $(this).data('holder'));
    });*/

});
// (function ($) {
//     var ww = 0;
//     var wh = 0;
//     var maxw = 0;
//     var minw = 0;
//     var maxh = 0;
//     var textShadowSupport = true;
//     var xv = 0;
//     var snowflakes = ["\u2744", "\u2745", "\u2746"];
//     var prevTime;
//     var absMax = 200;
//     var flakeCount = 0;
    
//     $(init);

//     function init()
//     {
//         var detectSize = function ()
//         {
//             ww = $(window).width();
//             wh = $(window).height();
            
//             maxw = ww + 300;
//             minw = -300;
//             maxh = wh + 300;
//         };
        
//         detectSize();
        
//         $(window).resize(detectSize);
        
//         if (!$('body').css('textShadow'))
//         {
//             textShadowSupport = false;
//         }
        
//         /* Should work in Windows 7 /*
//         if (/windows/i.test(navigator.userAgent))
//         {
//             snowflakes = ['*']; // Windows sucks and doesn't have Unicode chars installed
//             //snowflakes = ['T']; //No FF support for Wingdings
//         }
//         */
        
//         // FF seems to just be able to handle like 50... 25 with rotation
//         // Safari seems fine with 150+... 75 with rotation
//         var i = 50;
//         while (i--)
//         {
//             addFlake(true);
//         }
        
//         prevTime = new Date().getTime();
//         setInterval(move, 50);
//     }

//     function addFlake(initial)
//     {
//         flakeCount++;
        
//         var sizes = [
//             {
//                 r: 0.3,
//                 css: {
//                     fontSize: 15 + Math.floor(Math.random() * 20) + 'px',
//                     textShadow: '9999px 0 0 rgba(238, 238, 238, 0.5)'
//                 },
//                 v: 2
//             },
//             {
//                 r: 0.2,
//                 css: {
//                     fontSize: 50 + Math.floor(Math.random() * 20) + 'px',
//                     textShadow: '9999px 0 2px #eee'
//                 },
//                 v: 3
//             },
//             {
//                 r: 0.2,
//                 css: {
//                     fontSize: 90 + Math.floor(Math.random() * 30) + 'px',
//                     textShadow: '9999px 0 6px #eee'
//                 },
//                 v: 9
//             },
//             {
//                 r: 0.1,
//                 css: {
//                     fontSize: 150 + Math.floor(Math.random() * 50) + 'px',
//                     textShadow: '9999px 0 24px #eee'
//                 },
//                 v: 11
//             }
//         ];
    
//         var $nowflake = $('<span class="winternetz">' + snowflakes[Math.floor(Math.random() * snowflakes.length)] + '</span>').css(
//             {
//                 /*fontFamily: 'Wingdings',*/
//                 color: '#eee',
//                 display: 'block',
//                 position: 'fixed',
//                 background: 'transparent',
//                 width: 'auto',
//                 height: 'auto',
//                 margin: '0',
//                 padding: '0',
//                 textAlign: 'left',
//                 zIndex: 9999
//             }
//         );
        
//         if (textShadowSupport)
//         {
//             $nowflake.css('textIndent', '-9999px');
//         }
        
//         var r = Math.random();
    
//         var i = sizes.length;
        
//         var v = 0;
        
//         while (i--)
//         {
//             if (r < sizes[i].r)
//             {
//                 v = sizes[i].v;
//                 $nowflake.css(sizes[i].css);
//                 break;
//             }
//         }
    
//         var x = (-300 + Math.floor(Math.random() * (ww + 300)));
        
//         var y = 0;
//         if (typeof initial == 'undefined' || !initial)
//         {
//             y = -300;
//         }
//         else
//         {
//             y = (-300 + Math.floor(Math.random() * (wh + 300)));
//         }
    
//         $nowflake.css(
//             {
//                 left: x + 'px',
//                 top: y + 'px'
//             }
//         );
        
//         $nowflake.data('x', x);
//         $nowflake.data('y', y);
//         $nowflake.data('v', v);
//         $nowflake.data('half_v', Math.round(v * 0.5));
        
//         $('body').append($nowflake);
//     }
    
//     function move()
//     {
//         if (Math.random() > 0.8)
//         {
//             xv += -1 + Math.random() * 2;
            
//             if (Math.abs(xv) > 3)
//             {
//                 xv = 3 * (xv / Math.abs(xv));
//             }
//         }
        
//         // Throttle code
//         var newTime = new Date().getTime();
//         var diffTime = newTime - prevTime;
//         prevTime = newTime;
        
//         if (diffTime < 55 && flakeCount < absMax)
//         {
//             addFlake();
//         }
//         else if (diffTime > 150)
//         {
//             $('span.winternetz:first').remove();
//             flakeCount--;
//         }
        
//         $('span.winternetz').each(
//             function ()
//             {
//                 var x = $(this).data('x');
//                 var y = $(this).data('y');
//                 var v = $(this).data('v');
//                 var half_v = $(this).data('half_v');
                
//                 y += v;
                
//                 x += Math.round(xv * v);
//                 x += -half_v + Math.round(Math.random() * v);
                
//                 // because flakes are rotating, the origin could be +/- the size of the flake offset
//                 if (x > maxw)
//                 {
//                     x = -300;
//                 }
//                 else if (x < minw)
//                 {
//                     x = ww;
//                 }
                
//                 if (y > maxh)
//                 {
//                     $(this).remove();
//                     flakeCount--;
                    
//                     addFlake();
//                 }
//                 else
//                 {
//                     $(this).data('x', x);
//                     $(this).data('y', y);

//                     $(this).css(
//                         {
//                             left: x + 'px',
//                             top: y + 'px'
//                         }
//                     );
                    
//                     // only spin biggest three flake sizes
//                     if (v >= 6)
//                     {
//                         $(this).animate({rotate: '+=' + half_v + 'deg'}, 0);
//                     }
//                 }
//             }
//         );
//     }
// })(jQuery);
var vkAudioExport = {};
vkAudioExport.Analytics = {
    trackEvent: function(category, action, label) {
        var eventObject = {
                'eventCategory': category,
                'eventAction': action
            },
            mixpanelName = category;

        if (label) {
            eventObject.eventLabel = label;
            mixpanelName = mixpanelName + ': ' + label;
        }
        if (window.ga) {
            ga('send', 'event', eventObject);
        }
        if (window.mixpanel) {
            mixpanel.track(mixpanelName);
        }
    },
    bindToVideoPlay: function() {
        var _this = this;
        $('video').on('playing', function() {
            _this.trackEvent('Footer', 'play', 'video');
        });
    },
    bindToAllClicks: function() {
        var _this = this;
        $('body').on('click', '[data-analytics-category]', function() {
            var category = $(this).data('analyticsCategory'),
                label = $(this).data('analyticsLabel');

            _this.trackEvent(category, 'click', label);
        });
    },

    init: function() {
        this.bindToAllClicks();
        this.bindToVideoPlay();
    }
};
$(function() {
    vkAudioExport.Analytics.init();
});