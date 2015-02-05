(function() {

	var module = angular.module('pacificaDirectives', []);

	// This first looks at the string value, and if it exists, uses
	// that. Otherwise, it uses the int value.
	function getHabitValue(habitValue) {

		if (habitValue.valueString)
			return habitValue.valueString;
		
		return habitValue.valueInt;	
	}

	function hexToRgb(hex) {
	    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });

	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	}

	module.directive('goBack', function() {

		return {
			restrict: 'E',
			templateUrl: "views/directives/back.html",
			transclude: true,
			controller: function($scope, $ionicNavBarDelegate) {

				$scope.goBack = function goBack() {
		  		history.go(-1);

		  		// These seems to create circular references...
		  		// $ionicNavBarDelegate.back();
		  	}
			}
		}
	});

	module.directive('habitLineItem', function() {

		return {
			restrict: 'E',
			templateUrl: "views/directives/habitLineItem.html",
			replace: true,
			scope: { 
				habit: "="
			},
			controller: function($scope) {

			}
		}
	});

	// Handle enter keys for certain inputs.
	module.directive('paEnter', function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if(event.which === 13) {
          scope.$apply(function(){
              scope.$eval(attrs.paEnter, {'event': event});
          });

          event.preventDefault();
        }
      });
    };
  });

	// Global cache of playing line items. We use this so that we can
	// stop playing in other scopes.
	var playingAudioLineItems = [];

	module.directive('audioLineItem', function() {

		return {
			restrict: 'E',
			templateUrl: "views/directives/audioLineItem.html",
			replace: true,
			scope: { 
				src: "=",
				duration: "=",
				tags: "=",
				bgColor: "@",
				hide: "="
			},
			controller: function($scope, $element, $timeout, $analytics, MediaService, GeneralService, Environment) {

				// We aren't going to initialize this right away because we
				// don't want to use up any resources on the device.
				$scope.media;
				$scope.loading = false;
				$scope.playing = false;
				$scope.currentTime = 0.0;
				$scope.status = Media.MEDIA_STOPPED;

				$scope.getDuration = function getDuration() {
					return GeneralService.getTimeDisplay($scope.duration);
				}

				$scope.getAudioClass = function getAudioClass() {
					if ($scope.loading)
						return "loading";
					else if ($scope.playing)
						return "playing";
					else if ($scope.status == Media.MEDIA_STOPPED)
						return "stopped"; // Not sure if this is needed
					else
						return "paused";
				}

				$scope.monitorPlay = function() {

			  	$scope.media.getCurrentPosition(function (position) {
			  		
			  		if (position < 0)
			  			position = 0;

			  		// We get invalid positions back if the media is paused.
			  		if (position == 0 && $scope.status == Media.MEDIA_PAUSED)
			  			return;

			  		$scope.currentTime = position;

			  		drawCanvas();
				  	
				  	if ($scope.playing) {

				  		$timeout($scope.monitorPlay, 5);
				  	}
			  	});
			  }

			  $scope.$watch('hide', function() {
			  	if ($scope.playing && $scope.hide)
			  		$scope.playPause();
			  });

				$scope.playPause = function playPause() {

					event.stopPropagation();
					event.preventDefault();

					function localPlayPause() {
						if ($scope.media) {

							if ($scope.playing) {
								// Remove from the global list.
								removeFromPlayingItems();

								$scope.media.pause();

								$analytics.eventTrack('playAudioLineItem', {category: 'thoughts'});
							}
							else {

								if (playingAudioLineItems.length > 0) {

									var otherScope = playingAudioLineItems[0];

									playingAudioLineItems.length = 0; // Prevent an infinite loop
									otherScope.playPause();
								}

								playingAudioLineItems.push($scope);

								$scope.media.play();

								$scope.monitorPlay();

								// Monitor how far into the playing they are as an integer percentage
								// when they pause it.
								var percentage = Math.floor( ($scope.currentTime / $scope.duration) * 100);

								$analytics.eventTrack('pauseAudioLineItem', {category: 'thoughts', value: percentage});
							}

							$scope.playing = !$scope.playing;
						}
					}

					if (!$scope.media) {
						$loading = true;

						function statusCallback(status) {
							$scope.loading = false;
							$scope.status = status;

							if (status == Media.MEDIA_STOPPED) {
								$scope.playing = false;

								removeFromPlayingItems();

								$analytics.eventTrack('finishedAudioLineItem', {category: 'thoughts'});
							}

							$scope.$apply();
						}

						if (Environment.isIos() || $scope.src.startsWith('http')) {

							$scope.media = MediaService.loadMedia($scope.src, '', statusCallback);

							localPlayPause();
						}
						else {

							// This is a local media file, on Android. We need to load it from the temp storage.
							GeneralService.loadFile($scope.src, function(fileEntry) {

								// Again, Android only
								var filePath = fileEntry.nativeURL;
								var first = true;

								$scope.media = new Media(filePath,
							    // success callback
							    function(data) {
							        console.log("Created media: " + filePath);
							    },

							    // error callback
							    function(err) {
							        console.log("Could not create media [" + filePath + "] " + err.code + ", " + err.message);
							    },

							    statusCallback);

								// Now play it.
								localPlayPause();

							})
						}
					}
					else {
						localPlayPause();
					}
				}

				function removeFromPlayingItems() {
					var index = playingAudioLineItems.indexOf($scope);
			  	if (index >= 0)
			  		playingAudioLineItems.splice(index, 1);
				}

			  $scope.$on('$destroy', function() {

			  	removeFromPlayingItems();

			  	$scope.playing = false;

			  	if ($scope.media)
			  		$scope.media.release();
			  });

			  var canvas = $element.find("canvas")[0];


			  function handlePositionUpdate(evt) {

			  	evt.stopPropagation();
			  	evt.preventDefault();

			  	if (!$scope.media)
			  		return;

			  	var paddingLeft = parseInt($(canvas).css('padding-left'));
			  	var paddingRight = parseInt($(canvas).css('padding-right'));

			  	var width = $(canvas).outerWidth() - paddingLeft - paddingRight;
					var height = $(canvas).outerHeight();

			  	var x = 0;

			  	if (evt.changedTouches)
			    	x = evt.changedTouches[0].pageX - canvas.getBoundingClientRect().left - paddingLeft;

			    var loc = x / width;
			    var duration = $scope.media.getDuration();

			    $scope.media.seekTo(loc * duration * 1000);
			  }

			  canvas.addEventListener('touchstart', function(evt) {

			  	handlePositionUpdate(evt);
			  }, false);

				function drawCanvas() {

					var ctx = canvas.getContext("2d");

					// ctx.setTransform(1,0,0,1,0,0);

					var width = canvas.width;
					var height = canvas.height;

					ctx.clearRect(0, 0, width, height);

					ctx.beginPath();
					ctx.rect(0, 0, width, height);

					if ($scope.bgColor)
						ctx.fillStyle = $scope.bgColor;
					else
						ctx.fillStyle = '#969696';
					ctx.fill();

					// Run through the tags and render each one in the correct location.
					if ($scope.tags) {

						for (var i=0; i<$scope.tags.length; ++i) {

							var tag = $scope.tags[i];

							// This is the pixel location.
							var location = Math.floor((tag.tagTime / $scope.duration) * width);

							ctx.beginPath();
							ctx.rect(location-3, 0, 7, height); // location is the center

							if (tag.tagTypeString == 'positive')
								ctx.fillStyle = '#60d293';
							else
								ctx.fillStyle = '#ff6669';

							ctx.fill();
						}
					}

					// Draw the cursor
					var location = Math.floor(($scope.currentTime / $scope.duration) * width);

					ctx.beginPath();
					ctx.rect(location, 0, 2, height);

					ctx.fillStyle = '#fff';
					ctx.fill();
				}

				drawCanvas();

			}
		}
	});

	module.directive('anxietyGraph', function() {

		return {
			restrict: 'E',
			templateUrl: "views/directives/anxietyGraph.html",
			replace: true,
			scope: { 
				series: '=',
				hasData: '=',
				showBreathe: '=',
				showRethink: '=',
				showHabits: '=',
				showGoals: '='
			},
			controller: function($scope, $element) {

				$scope.chart;

				createChart();

				$scope.$watch('hasData', function() {

					if ($scope.hasData) {
						$scope.chart.hideLoading();

						// We need to update the data.

						$scope.chart.series[0].setData($scope.series.breatheData, false);
						$scope.chart.series[1].setData($scope.series.rethinkData, false);
						$scope.chart.series[2].setData($scope.series.habitData, false);
						$scope.chart.series[3].setData($scope.series.goalData, false);
						$scope.chart.series[4].setData($scope.series.missingMoodData, false);
						$scope.chart.series[5].setData($scope.series.moodData, false);

						$scope.updateSeries();
					}
				});

				$scope.updateSeries = function updateSeries() {

					if (!$scope.chart || !$scope.chart.series)
						return;

					$scope.chart.series[0].setVisible($scope.showBreathe);

					$scope.chart.series[1].setVisible($scope.showRethink);

					$scope.chart.series[2].setVisible($scope.showHabits);

					$scope.chart.series[3].setVisible($scope.showGoals);

					$scope.chart.redraw();
				}

				$scope.$watch('showBreathe', function() {

					$scope.updateSeries();
				});

				$scope.$watch('showRethink', function() {

					$scope.updateSeries();
				});

				$scope.$watch('showHabits', function() {

					$scope.updateSeries();
				});

				$scope.$watch('showGoals', function() {

					$scope.updateSeries();
				});

				function createCountSeries(name, data, visible, yaxis) {

					return {
						yAxis: yaxis,
	          type: 'spline',
	          name: name,
	          data: data,
	          visible: visible,
	          marker: {
	          	enabled: false
	          },
	          lineWidth: 2,
	          animation: false,
	          borderColor: 'transparent',
	          states: {
	          	hover: {
	          		enabled: false
	          	}
	          }
	        }
				}

				function createChart() {
					var container = $('.progressContainer')[0]; //.find(".progressContainer")[0];

		    	$scope.chart = new Highcharts.Chart({
		        chart: {
		            width: 300,
		            spacing: [10,0,3,0],
		            renderTo: container,
		            backgroundColor:'rgba(0,0,0, 0.3)'
		        },
		        tooltip: { enabled: false },
		        title: { text: '' },
		        legend: { enabled: false },
		        credits: { enabled: false },
		        xAxis: {
		            tickLength: 3, 
		            labels: {
		              enabled: false
		            },
		            lineWidth: 0,
							  minorGridLineWidth: 0,
							  // lineColor: 'transparent',
							  tickColor: '#ffffff',
							  tickInterval: 7,
							  tickPosition: 'outside'
		        },
		        yAxis: [{ // multiple y-axis labels allow the line and the graph both to scale indepdendently
		            title: '',
		            gridLineWidth: 0,
		            labels: {
		              enabled: false
		            },
		            min: 0,
		            max: 2, // For breathe/rethink
		            startOnTick: true,
		            endOnTick: true
		        },
		        { // multiple y-axis labels allow the line and the graph both to scale indepdendently
		            title: '',
		            gridLineWidth: 0,
		            labels: {
		              enabled: false
		            },
		            min: 0,
		            max: 6, // For health
		            startOnTick: true,
		            endOnTick: true
		        },
		        {
		            title: '',
		            gridLineWidth: 0,
		            labels: {
		              enabled: false
		            },
		            min: 0,
		            max: 6,
		            startOnTick: true,
		            endOnTick: true,
		            tickColor: '#ffffff',
		            tickInterval: 1,
							  tickPosition: 'inside',
							  tickWidth: 1,
							  tickLength: 3,
							  // plotBands: [{
							  // 	from: 0,
							  // 	to: 1,
							  // 	color: 'rgba(0,0,0,0)',
							  // 	label: {
							  // 		text: 'Awful',
							  // 		style: {
							  // 			color: '#ccc'
							  // 		}
							  // 	}
							  // },
							  // {
							  // 	from: 1,
							  // 	to: 2,
							  // 	color: 'rgba(0,0,0,0.1)',
							  // 	label: {
							  // 		text: 'Bad',
							  // 		style: {
							  // 			color: '#ccc'
							  // 		}
							  // 	}
							  // },
							  // {
							  // 	from: 2,
							  // 	to: 3,
							  // 	color: 'rgba(0,0,0,0)',
							  // 	label: {
							  // 		text: 'Not Good',
							  // 		style: {
							  // 			color: '#ccc'
							  // 		}
							  // 	}
							  // },
							  // {
							  // 	from: 3,
							  // 	to: 4,
							  // 	color: 'rgba(0,0,0,0.1)',
							  // 	label: {
							  // 		text: 'Okay',
							  // 		style: {
							  // 			color: '#ccc'
							  // 		}
							  // 	}
							  // },
							  // {
							  // 	from: 4,
							  // 	to: 5,
							  // 	color: 'rgba(0,0,0,0)',
							  // 	label: {
							  // 		text: 'Good',
							  // 		style: {
							  // 			color: '#ccc'
							  // 		}
							  // 	}
							  // },
							  // {
							  // 	from: 5,
							  // 	to: 6,
							  // 	color: 'rgba(0,0,0,0.1)',
							  // 	label: {
							  // 		text: 'Very Good',
							  // 		style: {
							  // 			color: '#ccc'
							  // 		}
							  // 	}
							  // },
							  // {
							  // 	from: 6,
							  // 	to: 7,
							  // 	color: 'rgba(0,0,0,0)',
							  // 	label: {
							  // 		text: 'Great',
							  // 		style: {
							  // 			color: '#ccc'
							  // 		}
							  // 	}
							  // }]
		        }],
		        colors: ['#73e5e4', '#ffbe66', '#ff8d6e', '#5ce59d', '#ffffff', '#ffffff'],
		        series: [
		        	createCountSeries('Breathe Data', $scope.series.breatheData, $scope.showBreathe, 0),
		        	createCountSeries('Rethink Data', $scope.series.rethinkData, $scope.showRethink, 0),
		        	createCountSeries('Goal Data', $scope.series.goalData, $scope.showGoals, 0),
		        	createCountSeries('Habit Data', $scope.series.habitData, $scope.showHabits, 1), 
		        	{
		        		yAxis: 2,
		            type: 'spline',
		            name: 'Mood Data',
		            data: $scope.series.missingMoodData,
		            marker: {
		            	enabled: false
		            },
		            lineWidth: 2,
		            animation: false,
		            borderColor: 'transparent',
		            states: {
		            	hover: {
		            		enabled: false
		            	}
		            }
		        }, {
		        		yAxis: 2,
		            type: 'spline',
		            name: 'Missing Mood Data',
		            data: $scope.series.moodData,
		            marker: {
		            	enabled: true,
		            	fillColor: '#ffffff',
		            	symbol: 'circle',
		            	radius: 2
		            },
		            lineWidth: 2,
		            animation: false,
		            borderColor: 'transparent',
		            states: {
		            	hover: {
		            		enabled: false
		            	}
		            }
		        }],
		        loading: {
			    		style: {
			    			background: 'transparent'
			    		}
			    	}
		    	});

					$scope.chart.showLoading();

					// TODO This could be cleaner.
					var rect = $("#progressContainer").find("rect");

					var width = +rect.attr("width");
					rect.attr("width", width-3);
					rect.attr("x", 3);

					// Not working...
					// var height = +rect.attr("height");
					// rect.attr("height", height-3);

					rect.attr("height", 147);

					// $timeout(function() {
					// 	var loading = $("#progressContainer").find(".highcharts-loading");

					// 	loading.attr("width", width-3);
					// 	loading.css("left", "3px");
					// 	loading.css("top", "0px");
					// 	loading.css("height", rect.attr("height") + "px");
					// }, 1000);

				}
			}
		}

	});

	var graphCount = 0;

	module.directive('graphSelector', function($timeout) {

		return {
			restrict: 'E',
			templateUrl: "views/directives/graphSelector.html",
			replace: true,
			transclude: true,
			scope: {
				values: "=",
				valueData: "=",
				goalPercentage: "=",
				showInnerCircle: "@",
				segmented: "@",
				selectable: "=",
				colors: "=",
				progressColors: "=", // This allows you to define the color displayed as you move through the graph
				colorPercentages: "=",
				showTicks: "@",
			},
			controller: function($scope, $element, Environment) {

				$("html").addClass("is_spinner");

				$scope.$on('$destroy', function() {

					$("html").removeClass("is_spinner");					
				});

				if (typeof $scope.selectable == 'undefined')
					$scope.selectable = true;

				// We can allow external control of the graph selector by 
				// watching the percentage valueData variable. If it is
				// not defined, the graph will be controlled by the user.
				if (typeof $scope.valueData.percentage != 'undefined') {

					$scope.$watch('valueData.percentage', function() {

						if ($scope.valueData.percentage != 0 && !isNaN($scope.valueData.percentage))
							$scope.updateValues($scope.valueData.percentage);
					})
				}

				// Hacky way to define a redraw event. The owner of the directive can just
				// increment a redraw counter.
				$scope.$watch('valueData.redraw', function() {

					$scope.updateValues(lastPercentage);
				});

				// Colors are interesting. They allow us to break up the graph
				// into sections. The last color always defines the "remaining"
				// part of the graph. Colors leading up to the last one break it
				// up into sections. If there are three colors then, the
				// first will only be used for percentages up to 50%, after which
				// both the first and second will be used. The colors are
				// also bound, which allows the external controller to update them.

				// TODO Colors should always be defined now.
				if (typeof $scope.colors == 'undefined') {
					$scope.colors = ["#fff", "#ddd"];
				}

				function updateHabitValue() {

					if (!$scope.selectable || $scope.valueData.userInteracted)
						$scope.valueData.value = getHabitValue($scope.values[$scope.valueData.valueIndex]);	
				}

				var habitsLength = $scope.values.length;

				updateHabitValue();

				$scope.getDisplayText = function getDisplayText() {

					for (var i=0; i<habitsLength; ++i) {

						if (getHabitValue($scope.values[i]) == $scope.valueData.value)
							return $scope.values[i].display;
					}

					return $scope.valueData.value;
				}

				// This is the size of the canvas. 
				var size = 270;
				var halfSize = 135;

				// Distances from center.
				var outerSize = 120;
				var innerSize = 96;
				var middleSize = (outerSize + innerSize) / 2.0;
				var arcWidth = outerSize - innerSize;

				var twoPI = Math.PI * 2;
				var halfPI = Math.PI / 2;

				var mousedown = false;
				var lastPercentage = 0;

				// There's a strange case where trying to display this back to back
				// will get the same canvas element both times.
				var canvas = $element.find("canvas")[0];
				var ctx = canvas.getContext("2d");

				function getMousePos(canvas, evt) {
			    var rect = canvas.getBoundingClientRect();

			    // Try to handle both android and ios...
			    var x;

			    if (evt.changedTouches)
			    	x = evt.changedTouches[0].pageX;

			    if (!x) 
			    	x = (typeof evt.pageX != 'undefined') ? evt.pageX : evt.clientX;

			    var y;
			    if (evt.changedTouches)
			    	y = evt.changedTouches[0].pageY;
			    
			    if (!y) 
			    	y = (typeof evt.pageY != 'undefined') ? evt.pageY : evt.clientY;
			    
			    return {
			      x: x - rect.left,
			      y: y - rect.top
			    };
			  }

			  var iteration = 0;

				$scope.updateValues = function updateValues(percentage) {

					++iteration;

					lastPercentage = percentage;

					ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

					// Super hack. Android freezes the canvas after a while. But if we do this
					// too much, the app crashes...
					if (Environment.isAndroid() && ((iteration % 25) == 0)) {
						var w=canvas.width;
			      canvas.width=1;
			      canvas.width=w;
			    }

					// var segments = chart.segments.length - 1;
					var segments = $scope.colors.length - 1;

					// Update the chart by recreating each segment.
					// chart.segments.length = 0;

					var currentSegment = 0;
					var segmentTotal = 0;

					// To draw the circle.
					var lastColor;

					for (var i=0; i<segments; ++i) {

						// This is a little weird. If the color percentages aren't defined, we are
						// assuming this is being used interactively, in which case we use the
						// current percentage.
						// Note: When we move to using ticks for each segment, we might need an interactive flag here.
						var segmentSize = $scope.colorPercentages ? $scope.colorPercentages[currentSegment] : percentage;

						var rgb;
						if ($scope.progressColors)
							rgb = hexToRgb($scope.progressColors[i]);
						else
							rgb = hexToRgb($scope.colors[i]);

						var rgbString = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ", 0.7)";
						ctx.strokeStyle = rgbString;
						lastColor = rgbString;

						ctx.lineWidth = arcWidth;

						if (percentage >= (segmentTotal + segmentSize)) {
							// Draw an arc from the segmentTotal to the new segment size.

							ctx.beginPath();
							// centered at halfSize,halfSize, 
				    	ctx.arc(halfSize, 
				    		      halfSize, 
				    		      middleSize, 
				    		      (twoPI * segmentTotal) - halfPI, 
				    		      (twoPI * (segmentTotal + segmentSize)) - halfPI, 
				    		      false);
				    	
				    	ctx.stroke();

							++currentSegment;
						}
						else {

							var nextEnd;
							if ($scope.segmented)
								nextEnd = Math.ceil(percentage * habitsLength) / habitsLength;
							else
								nextEnd = percentage;

							ctx.beginPath();
							ctx.arc(halfSize, 
										  halfSize, 
										  middleSize,
										  ((twoPI * segmentTotal) - halfPI),  
										  ((twoPI * nextEnd) - halfPI),
										  false);

							ctx.stroke();

							var nextStart = ((twoPI * nextEnd) - halfPI);

							// If we haven't reached the goal, fill in that part in opacity.

							if (percentage < $scope.goalPercentage) {
								
								var rgb = hexToRgb($scope.colors[i]);

								// Need to add opacity to a hex value.
								var rgbString = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ", 0.25)";
								ctx.strokeStyle = rgbString;

								ctx.beginPath();
								ctx.arc(halfSize, 
											  halfSize, 
											  middleSize,
											  ((twoPI * nextEnd) - halfPI),
											  ((twoPI * $scope.goalPercentage) - halfPI),
											  false);

								ctx.stroke();

								nextStart = ((twoPI * $scope.goalPercentage) - halfPI);
							}

							ctx.beginPath();
							
							var finalrgb = hexToRgb($scope.colors[$scope.colors.length-1]);
							var rgbString = "rgba(" + finalrgb.r + "," + finalrgb.g + "," + finalrgb.b + ", 0.25)";
							ctx.strokeStyle = rgbString;

							ctx.arc(halfSize,
										  halfSize,
										  middleSize,
										  nextStart,
										  twoPI - halfPI,
										  false);
							ctx.stroke();

							break;
						}

						segmentTotal += segmentSize;
					}

			    // Update the value back to the owner of this directive.
					var valuesLength = $scope.values.length;

					// Don't update the value if they haven't touched anything.
					if (!$scope.selectable || $scope.valueData.userInteracted) {
						$scope.valueData.valueIndex = Math.floor(percentage * valuesLength);

						// This happens when the percentage reaches 1 I think.
						if ($scope.valueData.valueIndex >= valuesLength)
							$scope.valueData.valueIndex = valuesLength - 1;

						updateHabitValue();
					}


				  if ($scope.showTicks) {
				    ctx.save();
						ctx.setTransform(1, 0, 0, 1, halfSize, halfSize);
						
						ctx.lineWidth = 2;
						ctx.strokeStyle = "#fff";

						var start = innerSize;

						for (var i=0; i<habitsLength; ++i) {

							ctx.save();
							var rotation = (360.0 / habitsLength)*i*Math.PI/180.0;
							ctx.rotate(rotation);

							ctx.beginPath();
							ctx.moveTo(0, -innerSize);
							ctx.lineTo(0, -outerSize);
							ctx.stroke();

							ctx.restore();
						}

						ctx.restore();
				  }

					// This is radians going clockwise from 90 degrees.
					var radians = (percentage * Math.PI * 2);

					// Convert to "real" radians.
					radians = (Math.PI) - radians;

					// Cos and Sin are flipped because the angle starts at 90 degrees
					var x = Math.sin(radians) * middleSize;
					var y = Math.cos(radians) * middleSize;
					
			    if ($scope.selectable) {

						// Draw the circle.
						ctx.beginPath();
			      ctx.arc(halfSize + x, halfSize + y, 16, 0, 2 * Math.PI, false);
			      ctx.fillStyle = lastColor;
			      ctx.fill();

			      ctx.lineWidth = 6;
			      ctx.strokeStyle = '#fff';
			      ctx.stroke();

			    }

			    // expanding circle

			   //  if ($scope.showInnerCircle) {
				  //   var max = (scale / 2.0) - (circleOffset * 2);

				  //   var val = percentage < 0.5 ? percentage / 0.5 : (1.0 - percentage) / 0.5;
				  //   ctx.beginPath();
				  //   ctx.arc((scale / 2.0), (scale / 2.0), max * val, 0, 2 * Math.PI, false);
				  //   ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
				  //   ctx.fill();
				  // }

				  // Hacks to try to get canvas to redraw.
				  ctx.clearRect(0, 0, 1, 1);
				}

				function handleMove(evt, snap) {

					$scope.valueData.userInteracted = true;

					evt.preventDefault();
					evt.stopPropagation();

			    var mousePos = getMousePos(canvas, evt);
			    // var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;

			    var x = (mousePos.x - halfSize);
			    var y = (mousePos.y - halfSize);

			    var atan = Math.atan2( y, x );

			    atan += (Math.PI / 2);

			    // This will be the rotation in degress from the top of the circle.
			    var rotation = atan * 180 / Math.PI;
			    if (rotation < 0)
			    	rotation += 360;

			    if (snap) {

			    	var segment = 360 / habitsLength;

			    	rotation = (Math.floor(rotation / segment) * segment) + (0.5 * segment);
			    }

			    var percentage = rotation / 360;

			    $scope.updateValues(percentage);
			    $scope.$apply();
				}

				function snapToSection(evt) {

					handleMove(evt, true);
				}

				if ($scope.selectable) {
				  canvas.addEventListener('mousedown', function(evt) {
				  	mousedown = true;
				  });

				  canvas.addEventListener('mouseup', function(evt) {
				  	mousedown = false;
				  }); 

				  // Handle both web and mobile.
					var mousemove = canvas.addEventListener('mousemove', function(evt) {
						
						if (!mousedown) return;

						handleMove(evt);
					});

					canvas.addEventListener('touchmove', function(evt) {

						// Try to handle both mouse move and touch move events.
						// canvas.removeEventListener(mousemove);

						handleMove(evt);

				  }, false);

				  canvas.addEventListener('touchend', function(evt) {

				  	snapToSection(evt);

				  }, false);
				}


				// Update the initial values in the display. Also, make sure it starts in the middle
				var startPercentage = $scope.valueData.valueIndex / habitsLength;
				if (startPercentage > 0)
					startPercentage += (0.5 / habitsLength);

				// Hack, trying to get Android to render correctly.
				$timeout(function() {
					$scope.updateValues(startPercentage);
				}, 1);
			}
		}
	});

})();