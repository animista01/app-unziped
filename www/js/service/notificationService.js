var servicesModule = angular.module('notificationService', []);

servicesModule.factory('NotificationService', ['$http', '$rootScope', 'authHttp', 'Environment', 'AccountService', 

	function($http, $rootScope, authHttp, Environment, AccountService) {

		var notificationService = {};

		// result contains any message sent from the plugin call
		window.notificationSuccessHandler = function notificationSuccessHandler (result) {
		    console.log('GCM Token = ' + result);
		}

		// result contains any error description text returned from the plugin call
		window.notificationErrorHandler = function notificationErrorHandler (error) {
		    console.log('error = ' + error);
		}

		// iOS only
		window.tokenHandler = function tokenHandler (result) {
		    // Your iOS push server needs to know the token before it can push to this device
		    // here is where you might want to send it the token for later use.
		    console.log('APNS token = ' + result);

		    AccountService.registerAPNSToken(result);
		}

		// iOS
		window.onNotificationAPN = function onNotificationAPN (event) {
			  // Don't really like this
		    // if ( event.alert )
		    // {
		    //     navigator.notification.alert(event.alert);
		    // }

		    if ( event.sound )
		    {
		        var snd = new Media(event.sound);
		        snd.play();
		    }

		    if ( event.badge )
		    {
		        pushNotification.setApplicationIconBadgeNumber(notificationSuccessHandler, notificationErrorHandler, event.badge);
		    }
		}

		// Android and Amazon Fire OS
		window.onNotification = function onNotification(e) {
		    console.log('EVENT -> RECEIVED:' + e.event);

		    switch( e.event )
		    {
				    case 'registered':
				        if ( e.regid.length > 0 )
				        {
				            // Your GCM push server needs to know the regID before it can push to this device
				            // here is where you might want to send it the regID for later use.
				            console.log("regID = " + e.regid);

				            AccountService.registerGCMToken(e.regid);
				        }
				    break;

				    case 'message':
				        // if this flag is set, this notification happened while we were in the foreground.
				        // you might want to play a sound to get the user's attention, throw up a dialog, etc.
				        if ( e.foreground )
				        {
				            console.log('--INLINE NOTIFICATION--');

				            // on Android soundname is outside the payload.
				            // On Amazon FireOS all custom attributes are contained within payload
				            var soundfile = e.soundname || e.payload.sound;
				            // if the notification contains a soundname, play it.
				            var my_media = new Media("/android_asset/www/"+ soundfile);
				            my_media.play();
				        }
				        else
				        {  // otherwise we were launched because the user touched a notification in the notification tray.
				            if ( e.coldstart )
				            {
				                console.log('COLDSTART NOTIFICATION--');
				            }
				            else
				            {
				                console.log('BACKGROUND NOTIFICATION--');
				            }
				        }

				       console.log('MESSAGE -> MSG: ' + e.payload.message);
				           //Only works for GCM
				       console.log('MESSAGE -> MSGCNT: ' + e.payload.msgcnt);
				       //Only works on Amazon Fire OS
				       console.log('MESSAGE -> TIME: ' + e.payload.timeStamp);
				    break;

				    case 'error':
				        console.log('ERROR -> MSG:' + e.msg);
				    break;

				    default:
				        console.log('EVENT -> Unknown, an event was received and we do not know what it is.');
				    break;
		  	}
		}


		notificationService.registerNotifications = function registerNotifications() {

			// Blackberry has been removed
			if ( device.platform == 'android' || device.platform == 'Android' || device.platform == "amazon-fireos" ){
			    pushNotification.register(
			    notificationSuccessHandler,
			    notificationErrorHandler,
			    {
			        "senderID": "435361669565",
			        "ecb":"onNotification"
			    });
			} else {
			    pushNotification.register(
			    tokenHandler,
			    notificationErrorHandler,
			    {
			        "badge":"true",
			        "sound":"true",
			        "alert":"true",
			        "ecb":"onNotificationAPN"
			    });
			}
		}

		return notificationService;
	}
]);