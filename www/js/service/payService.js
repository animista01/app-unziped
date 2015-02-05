var servicesModule = angular.module('payService', []);

servicesModule.factory('PayService', ['$http', '$rootScope', '$timeout', '$analytics', '$ionicPopup', '$ionicLoading', '$ionicModal', 'authHttp', 'Environment', 'AccountService',
	function($http, $rootScope, $timeout, $analytics, $ionicPopup, $ionicLoading, $ionicModal, authHttp, Environment, AccountService) {

		var initializedOfflineListener = false;

		var YEARLY_PRODUCT_ID = 'Pacifica_Yearly_Subscription';
		var SHORT_TERM_PRODUCT_ID = 'Pacifica_Monthly_Subscription';
  	
  	if (Environment.isAndroid()) {
  		YEARLY_PRODUCT_ID = 'pacifica_yearly_subscription_30';
  		SHORT_TERM_PRODUCT_ID = 'pacifica_monthly_subscription_3_99'
  	}

		var payService = { 
			subscribed: false,
			products: {},
			productVerificationAttempts: {},
			initializedStore: false,
			loadingError: false,
			verifyingPayment: false,
			isShowingModal: false,
			currentErrorPopup: undefined,
			isPurchasing: false // This is used so that we don't show reverifications
		}

		function getProductName(productId) {

			var product = payService.products[productId];
			if (product)
				return product.title;

			if (Environment.isOnline())
				return "Unknown";
			else
				return "[Offline]"
		}

		function getProductPrice(productId) {

			var product = payService.products[productId];
			if (product)
				return product.price;

			if (Environment.isOnline())
				return "Unknown";
			else
				return "Offline"
		}

		function getProductDuration(productId) {

			if (productId == YEARLY_PRODUCT_ID)
				return "1 Year";
			else
				return "1 Month";
		}

		function purchaseSubscription(productId) {

			var product = payService.products[productId];

			if (product) {

				// This will force the thank you modal to be displayed.
				payService.isPurchasing = true;

				store.order(product.id)
					.error(function(err) {

						console.log("got error in product.")
						$ionicLoading.hide();

						if (payService.currentErrorPopup)
							payService.currentErrorPopup.close();

						payService.currentErrorPopup = $ionicPopup.alert({
	            title: 'Error',
	            template: 'There was an error with the purchase. Please try again later or contact support at <a href="mailto:info@thinkpacifica.com">info@thinkpacifica.com</a>.<br><br>Code: ' + err.code + '<br>Message: ' + err.message,
	            okText: 'OK, GOT IT.',
	            okType: 'button-default'
	          });
	          payService.currentErrorPopup.then(function(res) {
	          	payService.currentErrorPopup = undefined;
	          });
					});
			}
			else {

				if (payService.currentErrorPopup)
					payService.currentErrorPopup.close();

				payService.currentErrorPopup = $ionicPopup.alert({
          title: 'Error',
          template: 'There was an error adding loading the product for purchase. Please try again later.',
          okText: 'OK, GOT IT.',
          okType: 'button-default'
        });
        payService.currentErrorPopup.then(function(res) {
        	payService.currentErrorPopup = undefined;
        });
			}
		}

		payService.getYearlyProductName = function getYearlyProductName() {

			return getProductName(YEARLY_PRODUCT_ID);
		}

		payService.getYearlyProductPrice = function getYearlyProductPrice() {

			return getProductPrice(YEARLY_PRODUCT_ID);
		}

		payService.getYearlyProductDuration = function getYearlyProductDuration() {

			return getProductDuration(YEARLY_PRODUCT_ID);			
		}

		payService.purchaseYearlySubscription = function purchaseYearlySubscription() {

			purchaseSubscription(YEARLY_PRODUCT_ID);
		}

		payService.getShortTermProductName = function getShortTermProductName() {

			return getProductName(SHORT_TERM_PRODUCT_ID);
		}

		payService.getShortTermProductPrice = function getShortTermProductPrice() {

			return getProductPrice(SHORT_TERM_PRODUCT_ID);
		}

		payService.getShortTermProductDuration = function getShortTermProductDuration() {

			return getProductDuration(SHORT_TERM_PRODUCT_ID);			
		}

		payService.purchaseShortTermSubscription = function purchaseShortTermSubscription() {

			purchaseSubscription(SHORT_TERM_PRODUCT_ID);
		}

		payService.isStoreLoaded = function isStoreLoaded() {

			// Do we need to be more complicated than this?
			return payService.products[YEARLY_PRODUCT_ID] || payService.isLoadingError();
		}

		payService.isLoadingError = function isLoadingError() {

			return payService.loadingError;
		}

		payService.isVerifyingPayment = function isVerifyingPayment() {

			return payService.verifyingPayments > 0;
		}

		// Be VERY careful with this. If two of these get kicked off, it's pretty bad. App crashes and all that.
		payService.refreshStore = function refreshStore() {
		
			// If two of these get kicked off at the same time it seems to be bad. This
			// check might not actually do much.
			// Also, avoid refreshing the store when the user can't upgrade. We'll never
			// show the prices then, and it can cause the user to need to log in.
			if (AccountService.canUpgrade()) {
			
				console.log("refreshing store.");

				if (!payService.initializedStore)
					payService.initStore();
				else
					store.refresh();
			}
			else {

				console.log("Skipping store refresh, user is premium.");
			}
		}

		$rootScope.$on('event:refreshStore', payService.refreshStore);

		payService.initStore = function initStore() {
			
			// Check availability of the store plugin
		  if (!window.store) {
        console.log('Store not available');
        payService.loadingError = true;
        return;
    	}
    	else {
    		console.log('Initializing Store.');
    	}

    	// Note that the refresh still happens below.
    	if (!payService.initializedStore) {

    		// Don't register these listeners again.
    		payService.initializedStore = true;

	    	// Enable maximum logging level
	    	store.verbosity = store.DEBUG;

	    	// Provide a way to validate receipts.
	    	store.validator = function(product, callback) {

	    		console.log("Calling validator with product: ");
	    		console.log(product);

	    		if (AccountService.canUpgrade() && product.transaction) {

	    			// This disables some of the retries that are happening within the store plugin I think.
	    			// Not really sure if we want to do this.
	    			// if (typeof payService.productVerificationAttempts[product.transaction.id] !== 'undefined') {

	    			// 	$ionicLoading.hide();

	    			// 	callback(false, "An attempt to verify the transaction has already been made.");

	    			// 	return;
	    			// }

        		++payService.verifyingPayments;

	        	AccountService.enablePremiumFeatures(product.transaction, product.id, product.price, function(result) {

	        		--payService.verifyingPayment;

	        		$ionicLoading.hide();

	        		if (result == 'false') {

	        			callback(false, { 
	        				error: {
	        					code: store.PURCHASE_EXPIRED,
	        					message: "This was either a purchase from a different user or it was expired."
	        				}
	        			});

				        // This could prevent us from verifying future purchases.
				        // TODO check on iOS that transaction.id exists.
	    					payService.productVerificationAttempts[product.transaction.id] = false;
	        		}
	        		else {

	        			payService.productVerificationAttempts[product.transaction.id] = true;

	    					callback(true, { });
						      
						    $rootScope.$broadcast('event:purchased');

	    					if (payService.isShowingModal) {

		        			$ionicLoading.show({
						        template: 'Purchase Verified.'
						      });

						      $timeout(function() {

						      	$ionicLoading.hide();

						      }, 2000);
						    }
	        		}
	        	});
	        }
	    	}
	    	
	    	store.register({
	        id:    YEARLY_PRODUCT_ID,
	        alias: 'Yearly Subscription',
	        type:  store.PAID_SUBSCRIPTION
	    	});

	    	store.register({
	        id:    SHORT_TERM_PRODUCT_ID,
	        alias: 'Short Term Subscription',
	        type:  store.PAID_SUBSCRIPTION
	    	});

	    	// Lifecycle is: Valid -> Requested -> Initiated -> Approved -> Finished -> Owned

	    	function purchaseApproved(p) {


	    		if (payService.isShowingModal) {

		    		$ionicLoading.show({
			        template: "Purchase Approved. Validating..."
			      });
		    	}
	    	}

	    	// This is called when the purchase was approved by the store
	    	store.when("Yearly Subscription").approved(function(p) {

	    		purchaseApproved(p);

	        console.log("Yearly Subscription attempting verify");
	        p.verify();
		    });
		    store.when("Short Term Subscription").approved(function(p) {

		    	purchaseApproved(p);

	        console.log("Short Term Subscription attempting verify");
	        p.verify();
		    });

		    // Once the purchase has been approved we need to verify it with out server.
		    store.when("Yearly Subscription").verified(function(p) {
	        console.log("Yearly Subscription verified");
	        p.finish();
		    });
		    store.when("Short Term Subscription").verified(function(p) {
	        console.log("Short Term Subscription verified");
	        p.finish();
		    });

		    store.when("Yearly Subscription").unverified(function(p) {
	        console.log("Yearly Subscription unverified");
	    	});
	    	store.when("Short Term Subscription").unverified(function(p) {
	        console.log("Short Term Subscription unverified");
	    	});


	    	function purchaseInitiated(p) {

	    		$ionicLoading.show({
		        template: "Initiating Purchase..."
		      });
	    	}

	    	store.when("Yearly Subscription").initiated(function(p) {

	    		purchaseInitiated(p);
	    	});
	    	store.when("Short Term Subscription").initiated(function(p) {

	    		purchaseInitiated(p);
	    	});

	    	function purchaseCancelled() {

	    		$ionicLoading.hide();

	    		$ionicPopup.alert({
	          title: 'Error',
	          template: 'Your purchase has been canceled. If this was in error, please contact support at <a href="mailto:info@thinkpacifica.com">info@thinkpacifica.com</a>.',
	          okText: 'OK, GOT IT.',
	          okType: 'button-default'
	        });
	    	}

	    	store.when("Yearly Subscription").cancelled(function(p) {

	    		purchaseCancelled(p);
	    	});
	    	store.when("Short Term Subscription").cancelled(function(p) {

	    		purchaseCancelled(p);
	    	});

	    	
	    	store.when("Yearly Subscription").updated(function(p) {

	    		console.log("Product updated: " + p.id);

	        payService.products[p.id] = p;
	    	});

	    	store.when("Short Term Subscription").updated(function(p) {

	    		console.log("Product updated: " + p.id);

	        payService.products[p.id] = p;
	    	});

	    	store.error(function(error) {

	    		$ionicLoading.hide();

	        console.log('ERROR ' + error.code + ': ' + error.message);

	        // There is an annoying case in the sandbox where we are trying to verify
	        // purchases for old products, or for receipts that are no longer valid.
	        // We don't want to display those.
	        if (error.code != store.ERR_PURCHASE && payService.isShowingModal) {
		        payService.loadingError = true;

		        if (!payService.currentErrorPopup) {
			        payService.currentErrorPopup = $ionicPopup.alert({
		            title: 'Error',
		            template: 'There was an error with the store. Please try again later or contact support at <a href="mailto:info@thinkpacifica.com">info@thinkpacifica.com</a>.<br><br>Code: ' + error.code + '<br>Message: ' + error.message,
		            okText: 'OK, GOT IT.',
		            okType: 'button-default'
		          });
		          payService.currentErrorPopup.then(function(res) {
		          	payService.currentErrorPopup = undefined;
		          });
			      }
		      }
	    	});

				if (AccountService.canUpgrade())
	    		store.refresh();
	    }
		}

		payService.showPremiumModal = function showPremiumModal($scope, category, label, upgradeModal) {


	    $scope.getYearlyProductName= function getYearlyProductName() {

	      return payService.getYearlyProductName();
	    }

	    $scope.getYearlyProductPrice = function getYearlyProductPrice() {

	      return payService.getYearlyProductPrice();
	    }

	    $scope.getYearlyProductDuration = function getYearlyProductDuration() {

	    	return payService.getYearlyProductDuration();
	    }

	    $scope.getShortTermProductName= function getShortTermProductName() {

	      return payService.getShortTermProductName();
	    }

	    $scope.getShortTermProductPrice = function getShortTermProductPrice() {

	      return payService.getShortTermProductPrice();
	    }

	    $scope.getShortTermProductDuration = function getShortTermProductDuration() {

	    	return payService.getShortTermProductDuration();
	    }

	    $scope.closeThankYouModal = function closeThankYouModal() {

	    	closeModal($scope.thankYouModal);

	    	// To prevent this from displaying multiple times.
	    	$scope.thankYouModal = undefined;
	    }

			$scope.closePremiumModal = function closePremiumModal() {

      	payService.isShowingModal = false;

      	if ($scope.premiumModal)
	      	closeModal($scope.premiumModal);
	    }

	    $scope.purchaseYearly = function purchaseYearly() {

	    	payService.purchaseYearlySubscription();
	    }

	    $scope.purchaseShortTerm = function purchaseShortTerm() {

	    	payService.purchaseShortTermSubscription();
	    }

	    $scope.refreshStore = function refreshStore() {

	    	payService.refreshStore();
	    }

	    $scope.$on('event:purchased', function() {

	    	if (payService.isPurchasing) {
		    	$scope.closePremiumModal();

		    	 $ionicModal.fromTemplateUrl('views/account/account.upgradeComplete.modal.html', {
		        scope: $scope,
		        animation: 'slide-in-up'
		      }).then(function(modal) {
		      	if (!$scope.thankYouModal) {
			        $scope.thankYouModal = modal;

			        openModal($scope.thankYouModal);
			      }
		      });
		    }
	    });

	    // Actually launch the modal
      $analytics.eventTrack('premiumWall', {category: 'relax', label: label});

      $ionicModal.fromTemplateUrl(upgradeModal ? 'views/account/account.upgrade.modal.html' : 'views/account/account.premiumFeature.modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.premiumModal = modal;

      	payService.isShowingModal = true;

        openModal($scope.premiumModal);
      });


	    // Called at the bottom of this file.
	    var attempts = 0;
	    function waitForStore() {

	      if (payService.isStoreLoaded()) {

	        // The payment service may have changed this for us.
	        if (!payService.isVerifyingPayment())
	          $ionicLoading.hide();

	        if (payService.isLoadingError()) {

	          $ionicPopup.alert({
	            title: 'Error',
	            template: 'There was an error loading the store. Please try again later.',
	            okText: 'OK, GOT IT.',
	            okType: 'button-default'
	          });
	        }
	        else {

	        	// Check to see if the payment was actually verified.
	        	if (AccountService.isPremiumEnabled && !AccountService.canUpgrade()) {

	        		$scope.closePremiumModal();
	        	}
	        }
	      }
	      else {

	        +attempts;
	        if (attempts >= 20) {

	          $ionicLoading.hide();

	          $ionicPopup.alert({
	            title: 'Error',
	            template: 'We took too long refreshing the store contents. Please try again later.',
	            okText: 'OK, GOT IT.',
	            okType: 'button-default'
	          });
	        }
	        else {

	          $timeout(waitForStore, 500);
	        }
	      }
	    }

	    // The store is initialized elsewhere now.
			// function checkForStore() {

			// 	if (!payService.isStoreLoaded()) {

		 //      $ionicLoading.show({
		 //        template: "Checking Status..."
		 //      });

		 //      payService.initStore();

		 //      // Wait for things to initialize.
		 //      $timeout(waitForStore, 500);
		 //    }
	  //   }

	  //   if (AccountService.canUpgrade()) {

	  //     if (Environment.isOnline()) {

	  //       checkForStore();
	  //     }
	  //     else {

	  //     	if (!initializedOfflineListener) {
	  //     		initializedOfflineListener = true;

	  //       	$scope.$on('event:online', checkForStore);
	  //       }

	  //     }
	  //   }
		}

		return payService;
	}
]);