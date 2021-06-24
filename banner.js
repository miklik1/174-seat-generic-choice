/**
 * TACTIC™ Creative Library
 * Copyright (C) 2020 TACTIC™ Real-Time Marketing <https://tacticrealtime.com/>
 * Licensed under GNU GPL <https://tacticrealtime.com/license/sdk/>
 *
 * @author Anton Gorodnyanskiy
 * @date 10/07/2020
 */

(/**
 * @param {tactic} tactic
 */
function (tactic) {

	var

		// Lend TACTIC container.
		container = tactic.container,

		// Lend TACTIC utility namespace.
		utils = (tactic.utils || tactic.utilities),

		// Lend TACTIC Builder timeline namespace.
		timeline = tactic.builder.timeline;

	var

		/**
		 * Identify end transition name depending on a browser.
		 *
		 * @function
		 */
		whichTransitionEndEvent = function () {

			var

				/**
				 * @type {Element|Node}
				 */
				element = document.createElement('div'),

				/**
				 * @type {Object}
				 */
				handlers = {
					'transition': 'transitionend',
					'OTransition': 'oTransitionEnd',
					'MozTransition': 'transitionend',
					'WebkitTransition': 'webkitTransitionEnd'
				};

			for (var i in handlers) {
				if (element.style[i] !== undefined) {
					return handlers[i];
				}
			}

		},

		/**
		 * Duplicate HTML element.
		 *
		 * @function
		 * @param {Element|Node} target
		 * @param {String} key
		 * @param {Number} times
		 */
		duplicateDomElement = function (target, key, times) {
			try {

				var

					/**
					 * Find preset in sequence target.
					 *
					 * @type {Element|Node}
					 */
					preset = utils.getElementsByKey(target, key + '_0')[0];

				// Check if preset was found.
				if (preset) {

					// Loop frame times.
					for (var index = 1; index < times; index++) {

						var

							/**
							 * Clone initial frame preset.
							 *
							 * @type {(Element|Node)}
							 */
							clone = preset.cloneNode(true);

						// Set layer key.
						clone.setAttribute("data-key", key + '_' + index);

						// Append sequence frame clone to sequence holder.
						target.appendChild(clone);

					}

				}

			} catch (error) {
			}
		},

		/**
		 * Create image poster data depending on video data.
		 *
		 * @type {Function}
		 * @param {Object} data
		 * @return {Object}
		 */
		convertVideoToImage = function (data) {

			// Check if data is provided.
			if (!data) {

				// Return null.
				return null;

			}

			// Change layer type.
			data.type = 'ImageLayer';

			// Check if data has sources.
			if (data.sources) {

				// Loop all data sources.
				utils.each(data.sources,

					/**
					 * @param {Object} source
					 * @param {String} source.preview_url
					 * @param {String} source.thumb_url
					 * @param {Number} source.width
					 * @param {Number} source.height
					 * @param {Number} sourceIndex
					 */
					function (source, sourceIndex) {

						// Check if source is set.
						if (source) {

							// Convert video source to image source.
							data.sources[sourceIndex] = {
								width: source.width,
								height: source.height,
								url: (source.preview_url || source.thumb_url)
							};

						}

						// Check if parameters are available.
						if (data.params) {

							// Set polite load to false.
							data.params.polite = false;

						}

					}
				);

			}

			// Check if data has exceptions.
			if (data.excepts) {

				// Loop all data exceptions.
				utils.each(data.excepts,

					/**
					 * @param {Object} except
					 * @param {String} exceptIndex
					 */
					function (except, exceptIndex) {

						// Check if exception is not empty.
						if (except) {

							// Convert exception.
							data.excepts[exceptIndex] = convertVideoToImage(except);

						}
					}
				);

			}

			return data;
		},

		/**
		 * Check if layer source is the same as on next or previous frame.
		 *
		 * @type {Function}
		 * @param {tactic.builder.layers.AbstractLayer} layer
		 * @param {Number} direction
		 * @return {Object}
		 */
		layerSourceIsIdentical = function (layer, direction) {

			try {

				var

					/**
					 * @type {tactic.builder.layers.SequenceLayer}
					 */
					sequence = layer.sequence;

				// Check if layer is sequenced.
				if (sequence) {

					var

						/**
						 * @type {tactic.builder.layers.FrameLayer}
						 */
						frame_comparison = layer.sequence[(direction >= 0) ? 'next' : 'previous'];

					// Check if sequence has next or previous frame.
					if (frame_comparison) {

						var

							/**
							 * @type {tactic.builder.layers.AbstractLayer}
							 */
							layer_comparison = frame_comparison.getLayer(layer.key, 5);

						// Check if source is the same as on previous frame.
						if (layer_comparison && JSON.stringify(layer_comparison.sources) === JSON.stringify(layer.sources)) {
							return true;
						}

					}

				}

			} catch (e) {
			}

			return false;
		},

		/**
		 * Relocate layer from one to another place in the registry.
		 *
		 * @function
		 * @param text_layer {tactic.builder.layers.TextLayer}
		 * @param text_wrapper_layer {tactic.builder.layers.AbstractLayer}
		 * @param holder_layer {tactic.builder.layers.AbstractLayer}
		 * @param key {String}
		 * @param holder {String}
		 * @param wrapper {String}
		 */
		duplicateTextLayer = function (text_layer, text_wrapper_layer, holder_layer, key, holder, wrapper) {

			try {

				var

					/**
					 * @type {Object}
					 */
					data = utils.cloneObject(text_layer.data);

				// Change button text layer related params to message related.
				data.params.holder = holder;
				data.params.wrapper = wrapper;

				// Disable initial button layer as it was moved to message.
				data.enabled = text_wrapper_layer.data.enabled;

				// Duplicate button text layer into the message layer.
				holder_layer.addLayer(tactic.builder.layers.TextLayer, key, data, bannerEventHandler);

			} catch (e) {
			}

		},

		// /**
		//  * Adjust splash position so it stands right over message.
		//  *
		//  * @function
		//  * @param layer {tactic.builder.layers.AbstractLayer}
		//  */
		// adjustDescriptionPosition = function (layer) {
		// 	try {
		//
		// 		var
		//
		// 			/**
		// 			 * @type {tactic.builder.layers.JointLayer}
		// 			 */
		// 			MS_layer = layer.parent.getLayer('MS'),
		//
		// 			/**
		// 			 * @type {tactic.builder.layers.JointLayer}
		// 			 */
		// 			BT_layer = layer.parent.getLayer('BT');
		//
		// 		// Check if message layer was found.
		// 		if (MS_layer && MS_layer.target && BT_layer && BT_layer.target) {
		//
		// 			var
		//
		// 				/**
		// 				 * @type {Number}
		// 				 */
		// 				BT_offset = MS_layer.height();
		//
		// 			// Loop all message text.
		// 			utils.each(MS_layer.getLayer('MS_TXT').layers, function (MS_TXT_layer) {
		//
		// 				// Add offset.
		// 				BT_offset -= MS_TXT_layer.height();
		//
		// 			});
		//
		// 			// Check if offset calculation is positive.
		// 			if (BT_offset > 0) {
		//
		// 				// Add update position attribute to SPLASH layer.
		// 				BT_layer.addAttr('offset', {
		// 					css: {
		// 						'margin-top': '-' + BT_offset + 'px'
		// 					}
		// 				});
		//
		// 			}
		//
		// 		}
		//
		// 	}
		// 	catch (e) {
		// 	}
		// },

		/**
		 * @function
		 * @param {(Event)} event
		 */
		errorEventHandler = function (event) {

			// Track local event.
			container.trackEventNativeDef('log', 'error', 'BANNER');

			// Show fallback image.
			container.showFallback();

		},

		/**
		 * Create dynamic layers depending on data analysis.
		 * Assign layer events.
		 *
		 * @function
		 * @param event {Event}
		 * @param event.type {String}
		 * @param event.detail {Object}
		 */
		bannerEventHandler = function (event) {

			var

				/**
				 * @type {(tactic.builder.layers.AbstractLayer|tactic.builder.layers.BannerLayer|tactic.builder.layers.SequenceLayer|tactic.builder.layers.FrameLayer|tactic.builder.layers.ImageLayer|tactic.builder.layers.TextLayer|tactic.builder.layers.VideoLayer)}
				 */
				layer = this;

			// Validate layer target and event type.
			if (layer.target && event.type) {

				// Look for layer key.
				switch (layer.key) {

					case ('BN'):
					case ('BN_0'):
					case ('BN_1'):
					case ('BN_2'):
					case ('BN_3'):
					case ('BN_4'):
					case ('BN_5'):

						// Look for event type.
						switch (event.type) {

							// If layer was created.
							case ('set'):

								// Initialise timeline.
								timeline.init();

								// Initialise layer.
								layer.init();

								break;

							// In case of layer build event (when layer data is parsed and new layer instance needs to be created).
							case ('build'):

								// Check if additional detail is passed.
								// You are able to add new layer below and return it back to Banner constructor the way you want.
								// If nothing returned to Banner constructor, Banner will try to create new layer automatically.
								if (event.detail) {

									// Look for layer key.
									switch (event.detail.key) {

										// Look for sequence layer.
										case 'SQ':

											// Apply custom HTML adjustments before creating sequence layer.
											// Duplicate sequence frames (in case you don't have all elements set manually in HTML).
											duplicateDomElement(event.detail.parent.getTarget(event.detail.key), event.detail.key, event.detail.data.frames.length);

											// // Delete all frames except first one.
											// event.detail.data.frames = [event.detail.data.frames[0]];

											return;

										// Look for background video layer.
										case 'BG_VID_0':

											try {

												var

													/**
													 * @type {(tactic.builder.layers.VideoLayer)}
													 */
													BG_VID_0_layer = event.detail;

												// Create video poster image, so it loads before the video.
												// Check if background image is not defined.
												if (!BG_VID_0_layer.parent.parent.getLayer('BG_IMG_0', 1)) {

													// Create new background image using video data.
													BG_VID_0_layer.parent.parent.getLayer('BG_IMG').addLayer(tactic.builder.layers.ImageLayer, 'BG_IMG_0', convertVideoToImage(utils.cloneObject(BG_VID_0_layer.data)), bannerEventHandler);

												}

											} catch (e) {
											}

											return;

										// Look for button layer.
										case 'BT_TXT_0':

											try {

												var

													/**
													 * @type {(tactic.builder.layers.TextLayer)}
													 */
													BT_TXT_0_layer = event.detail,

													/**
													 * @type {(tactic.builder.layers.AbstractLayer)}
													 */
													BT_layer = BT_TXT_0_layer.parent.parent;

												duplicateTextLayer(event.detail, BT_layer, BT_layer.parent.getLayer('MS_TXT', 1), 'MS_TXT_2', 'MS_TXT', 'MS');

											} catch (e) {
											}

											return;

									}

								}

								return;

							// If layer was successfully initialised.
							case ('init'):

								// Check if Banner in in debug mode.
								if (layer.mode === 'debug') {

									// Add "mode_debug" attribute to root layer in order to highlight layer bounds.
									layer.addAttrs('mode_debug');

								}

								// Check if Banner does not support CSS animation.
								// Check if Banner is in capture mode, means snapshot has to be taken.
								if (layer.inanimate === true || layer.mode === 'capture') {

									// Add "anim_no" attribute to root layer in order to stop all transitions.
									// This will automatically add class name to layer related DOM element.
									// NB! Required for proper snapshot capture, as PhantomJS does not support CSS animations.
									layer.addAttrs('anim_no');

								}

								// Now load primary banner layer.
								// Proper font load utility requires all layers to be initialised before banner load function.
								// This will allow banner to index fonts that are in use and preload those before appending texts.
								// Custom fonts have to be preloaded in order to avoid wrong text holder positioning and styling (kerning, line heights).
								layer.load();

								break;

							// In case Banner is stopped.
							// NB! Creative will stop automatically in 30 seconds. This is required by the most ad networks.
							case ('stop'):

								// Add "anim_no_dur" attribute to root layer in order to make all transitions seamless.
								// This will automatically add same class name to layer related DOM element.
								layer.addAttrs('anim_no_dur');

								// Pause all banner playbacks.
								// Execute method recursively on all nested banner layers and frames.
								layer.execute('stop', false);

								break;

							// In case if banner is resized.
							case ('resize'):

								// Check if banner is responsive.
								if (container.NAME === 'RxR') {

									// Add no animation duration class.
									// This will result in limited animation on banner resize.
									layer.addAttrs('anim_no_dur');

									// Destroy all layers.
									layer.execute('destroy');

									// Initialise layers again.
									layer.execute('init');

									timeline.requestTimeout(function () {

										// Check if banner is not stopped.
										if (!layer.stopped) {

											// Remove no animation duration class (added on resize event).
											layer.removeAttrs('anim_no_dur');

										}

									}, 100);

								}

								break;

							// In case Banner is interacted.
							case ('interaction'):

								// Remove "anim_no_dur" attribute to root layer in order to reveal animations.
								layer.removeAttrs('anim_no_dur');

								break;

							// In case Banner is loaded, means static assets like fonts and images are loaded.
							// By default, Banner won't wait for any assets unless you indicate those in Banner parameters.
							case ('load'):

								layer.execute('init');

								// Add "ready" attribute to root layer. Will reveal banner contents.
								// This will automatically add same class name to layer related DOM element.
								layer.addAttrs('ready');

								// Check if Banner is in capture mode, means snapshot has to be taken.
								if (layer.mode === 'capture') {

									// Wait before all frames are initialised.
									timeline.requestTimeout(function () {

										// Stop banner.
										layer.stop();

										// Execute snapshot capture.
										// Capture delay can be set in Banner parameters, default value is 3 seconds.
										// Delay gives time for Banner related dynamic assets to load.
										layer.capture();

									}, 100);

								}

								var

									/**
									 * Get banner sequence layer.
									 *
									 * @type {tactic.builder.layers.SequenceLayer}
									 */
									SQ_layer = layer.getLayers('SQ')[0];

								var

									/**
									 * @function
									 */
									clickEventHandler = function () {

										var

											/**
											 * Get click tag object.
											 * Provide sequence position if available, this will select appropriate click tag if available.
											 *
											 * @type {Object}
											 */
											click_tag = layer.getClickTag(SQ_layer ? SQ_layer.state : NaN);

										// Open click tag using TACTIC container.
										// NB! It is important to not use window.open() in order to handle specific vendor click tag setup.
										container.clickThrough(click_tag.url, click_tag.vars);

									};

								// Check if sequence has frames or banner is in debug more.
								if (SQ_layer && (SQ_layer.frames.length > 1 || (layer.root.mode === 'debug'))) {

									// Loop all click layers in the banner.
									utils.each(layer.getLayers('CL'),

										/**
										 * Handle click event and redirect user to landing page destination URL.
										 * NB! This will open container.FALLBACK_CLICKTAG in case if click tag is not defined.
										 * NB! Fallback click tag is set to https://www.tacticrealtime.com/ in boilerplate environment only.
										 *
										 * @param {tactic.builder.layers.JointLayer} CL_layer
										 */
										function (CL_layer) {

											// Bind banner mouse or touch move event on body.
											// NB! This requires Banner instance to be initialised.
											layer.events.gesture = new utils.GestureListener(CL_layer.target, function (action, event, startEvent) {

												// Look for event type.
												switch (action) {

													// If element was moved.
													case ('click'):

														clickEventHandler();

														// Pause sequence.
														SQ_layer.pause();

														break;

													// If element was moved.
													case ('start'):

														// Pause sequence.
														SQ_layer.pause();

														break;

													// If element was moved.
													case ('move'):

														break;

													// If element move was stopped.
													case ('stop'):

														// Check if sequence has layers.
														if (SQ_layer.frames.length > 1 || layer.root.mode === 'debug') {

															var

																/**
																 * @type {Number}
																 */
																offset = -((startEvent.pageX || startEvent.clientX) - (event.pageX || event.clientX));

															// If no swipe action detected.
															if (offset < 0) {

																// Change sequence to next frame.
																SQ_layer.changeNext();

															}

															// If swiped right.
															else if (offset > 0) {

																// Change sequence to previous frame.
																SQ_layer.changePrevious();

															}

														}

														else {

															// Handle click event.
															clickEventHandler();

														}

														break;

												}

											});

											// // Bind banner click event on click layer.
											// // NB! This requires Banner instance to be initialised.
											// layer.events.gesture = utils.addEventSimple(CL_layer.target, 'click', clickEventHandler);

										}
									);

								}

								// Otherwise assign click event to entire banenr document.
								else {

									// Bind banner click event on click layer.
									// NB! This requires Banner instance to be initialised.
									layer.events.gesture = utils.addEventSimple(document.body, 'click', clickEventHandler);

								}

								break;

						}

						break;

					case ('SQ'):

						// Check what happened.
						switch (event.type) {

							// If layer was initialised.
							case ('init'):

								// Load layer.
								layer.load();

								// Play layer.
								layer.play();

								break;

							// If layer was loaded.
							case ('load'):

								break;

							// If sequence starts playing.
							case ('play'):

								break;

							// If sequence is paused.
							case ('pause'):

								break;

							// If sequence frame has changed.
							case ('change'):

								// Invoke sequence load processes on every frame change.
								// Function will decide which frames have to be loaded depending on parameters and execute load command on all nested layers.
								// Default setup will pre-load next frame in advance.
								layer.load();

								break;

						}

						break;

					// In case of all other Banner layer keys.
					default:

						// Look for event type.
						switch (event.type) {

							// If layer was initialised.
							case ('init'):

								// Add hidden attribute.
								layer.addAttr('hidden');

								// Check if layer can be loaded.
								// We don't want to load all frames of the sequence by default.
								if (layer.loadable()) {

									// Load layer.
									layer.load();

								}

								break;

							// If layer was successfully loaded or entered.
							case ('load'):
							case ('enter'):

								// Check if layer is available.
								// Will return false if sequenced and not on current frame.
								if (layer.available()) {

									// Remove hidden attribute.
									layer.removeAttr('hidden');

									// Add empty attribute to the frame layer, so other layers know.
									// NB! Important layers has to go first in the data.
									switch (layer.key) {

										// Look for needed layer keys.
										case 'LG_IMG_0':

											layer.addAttr('ready', { name: 'ready' });

											break;

										// Look for background video layer.
										case 'BG_VID_0':

											try {

												// Hide poster image, class is defined in manifest.
												layer.wrapper.getLayer('BG_IMG_0', 1).addAttr('anim_BG_IMG_out', {
													name: 'anim_BG_IMG_out'
												});

											} catch (e) {

											}

											break;

									}

									var

										/**
										 * @type {Boolean}
										 */
										layer_next_identical = layerSourceIsIdentical(layer, -1);

									// Set timeout so layer attributes appended.
									timeline.requestTimeout(function () {

										// Loop all animations.
										utils.each(layer.getAnims(),

											/**
											 * @param {Object} anim
											 * @param {String} animKey
											 */
											function (anim, animKey) {

												// Check if animation can be skipped.
												if (layer_next_identical && anim.skip) {

													// Add animation class to fade in.
													anim.target.addAttrs(anim.name + '_skip');

												}

												// Add animation class to fade in.
												anim.target.addAttrs(anim.name + '_in');

												// Add animation class to fade in.
												anim.target.removeAttrs(anim.name + '_out');

											}
										);

										// // Look for layers key.
										// switch (layer.key) {
										//
										// 	// Look for needed layer keys.
										// 	case 'BT':
										//
										// 		// Adjust description position to match message height.
										// 		adjustDescriptionPosition(layer);
										//
										// 		break;
										//
										// }

									}, 0);

									break;

								}

								break;

							// If layer is entered.
							case ('leave'):

								var

									/**
									 * @type {Boolean}
									 */
									layer_prev_identical = layerSourceIsIdentical(layer, 1);

								// Loop all animations.
								utils.each(layer.getAnims(),

									/**
									 * @param {Object} anim
									 * @param {String} animKey
									 */
									function (anim, animKey) {

										// Add animation class to fade in.
										anim.target.removeAttrs(anim.name + '_in');

										// Add animation class to fade in.
										anim.target.addAttrs(anim.name + '_out');

										// Check if animation can be skipped.
										if (layer_prev_identical && anim.skip) {

											// Add animation class to fade in.
											anim.target.removeAttrs(anim.name + '_skip');

										}

									}
								);

								var
									/**
									 * Remove animation attributes when transition ends.
									 *
									 * @function
									 */
									removeAnimAttrs = function () {

										// Loop all animations.
										utils.each(layer.getAnims(),

											/**
											 * @param {Object} anim
											 * @param {String} animKey
											 */
											function (anim, animKey) {

												// Remove animation class to fade in.
												anim.target.removeAttrs(anim.name + '_out');

											}
										);

										layer.target.removeEventListener(whichTransitionEndEvent(), removeAnimAttrs);

									};

								layer.target.addEventListener(whichTransitionEndEvent(), removeAnimAttrs);

								break;

							// If layer was initialised.
							case ('enabled'):

								// Add "empty" attribute to hide layer.
								// This will automatically add same class name to layer related DOM element.
								layer.removeAttrs('empty');

								break;

							// If layer is disabled or empty.
							case ('empty'):
							case ('disabled'):

								// Add "empty" attribute to hide layer.
								// This will automatically add same class name to layer related DOM element.
								layer.addAttrs('empty');

								// Add empty attribute to the frame layer, so other layers know.
								// NB! Important layers has to go first in the data.
								switch (layer.key) {

									// Look for needed layer keys.
									case 'MS':
									case 'BT':

										var

											/**
											 * @type {String}
											 */
											layer_name = 'empty_' + layer.key;

										layer.sequence.frames[layer.frame].addAttr(layer_name, { name: layer_name, global: true });

										break;

									// Look for needed layer keys.
									case 'CN':

										var

											/**
											 * @type {String}
											 */
											layer_name = 'empty_' + layer.key;

										layer.root.getLayer('CV').addAttr(layer_name, { name: layer_name, global: true });

										break;

								}

								break;

						}

						break;

				}

			}

		};

	/// Wait for TACTIC container initialisation ready state event.
	// Start banner initialisation when container is ready, but wait with element build before fonts are loaded.
	container.ready(function (data) {

		// Bind error event on window.
		utils.addEventSimple(window, 'error', errorEventHandler);

		// Bind error event on body.
		utils.addEventSimple(document.body, 'error', errorEventHandler);

		// Create new Banner instance(s).
		// Include Banner instance to window namespace for easy access from console.
		// All further events and actions will be handled with callback handler.
		utils.each(((container.NAME === 'Preview' && (container.MEDIA === '' || container.MEDIA === 'native' || container.MEDIA === 'tactic' || container.MEDIA === 'tactic-local-preview')) ? ['BN_0', 'BN_1', 'BN_2', 'BN_3', 'BN_4', 'BN_5'] : ['BN']),

			/**
			 * @param {String} key
			 */
			function (key) {

				if (key === 'BN' || utils.getElementsByKey(document.body, key)[0]) {

					// Create new Banner instance.
					// All further events and actions will be handled with callback handler.
					window[key] = new tactic.builder.layers.BannerLayer(key, utils.cloneObject(data.banner), bannerEventHandler);

					try {

						// Check if banner is in debug mode.
						if (window[key].mode === 'debug') {

							// Find all selected elements in the banner.
							utils.each (window[key].getLayers(data.editor.state[0]), function (layer) {

								// Add debug mode class to highlight element if required.
								utils.addClass(layer.target, 'debug');

							});

						}

					} catch (e) {
					}

				}

			}
		);

	});

})(tactic);