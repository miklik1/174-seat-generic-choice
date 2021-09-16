/**
 * TACTIC™ Creative Library
 * Copyright (C) 2020 TACTIC™ Real-Time Marketing <https://tacticrealtime.com/>
 * Licensed under GNU GPL <https://tacticrealtime.com/license/sdk/>
 *
 * @author Anton Gorodnyanskiy
 * @date 18/11/2020
 * @edit 23/11/2020
 */

(/**
 * @param {tactic} tactic
 */
	function (tactic) {

		var

			// Lend TACTIC container.
			container = tactic.container,

			// Lend TACTIC utility namespace.
			utils = (tactic.utils || tactic.utilities);

		var

			/**ent Alignmen
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
			cloneDomElement = function (target, key, times) {

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

							// Check if element is not available in the document DOM.
							if (!document.querySelector('[data-key=' + key + '_' + index + ']')) {

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
						 * @param {Number} source_key
						 */
						function (source, source_key) {

							// Check if source is set.
							if (source) {

								// Convert video source to image source.
								data.sources[source_key] = {
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
						 * @param {String} except_key
						 */
						function (except, except_key) {

							// Check if exception is not empty.
							if (except) {

								// Convert exception.
								data.excepts[except_key] = convertVideoToImage(except);

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
						sequence_layer = layer.sequence;

					// Check if layer is sequenced.
					if (sequence_layer) {

						var

							/**
							 * @type {tactic.builder.layers.FrameLayer}
							 */
							frame_comparison = layer.sequence[(direction >= 0) ? 'current' : 'previous'];

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
			 * Check if layer is selected in the editor.
			 *
			 * @type {Function}
			 * @param {tactic.builder.layers.AbstractLayer} layer
			 * @return {Boolean}
			 */
			layerIsSelected = function (layer) {
				try {

					var

						/**
						 * @type {Array}
						 */
						debug_relations = [
							['MS', 'TL', 'DS', 'PR', 'BT']
						],

						/**
						 * @type {Array}
						 */
						debug_layers = [];

					for (var debug_relation_key in debug_relations) {
						if (debug_relations[debug_relation_key].indexOf(layer.key) !== -1) {
							debug_layers = debug_layers.concat(debug_relations[debug_relation_key]);
						}
					}

					// Look if editor scope is the same as layer key.
					if (layer.key === editor.scope[1] || (debug_layers.length > 0 && debug_layers.indexOf(editor.scope[1]) !== -1)) {

						// Check if layer is sequenced, means we have to be sure to select proper frame.
						if (layer.sequence) {

							// Check if layer sequence is the same as in the content editor.
							if (layer.sequence.current.index === editor.frame) {
								return true;
							}

						}
						else {
							return true;
						}

					}

				} catch (e) {
				}

				return false;
			},

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
			 * @function
			 * @param {tactic.builder.layers.AbstractLayer} layer
			 * @param {String} [url] Alternative click tag URL.
			 */
			clickEventHandler = function (layer, url) {

				var

					/**
					 * Get layer's click tag.
					 * @type {Object}
					 */
					click_tag = layer.getClickTag(url);

				// Open click tag using TACTIC container.
				// NB! It is important to not to use window.open() in order to handle specific vendor click tag settings.
				container.clickThrough(click_tag.url, click_tag.vars);

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

						// In case it is root banner.
						case ('BN'):

							// Look for event type.
							switch (event.type) {

								// If layer was created.
								case ('set'):

									// Initialise layer.
									layer.init();

									break;

								// In case of layer build event (when layer data is parsed and new layer instance needs to be created).
								case ('build'):

									// Check if additional detail is passed.
									// You are able to add new layer below and return it back to Banner constructor the way you want.
									// If nothing returned to Banner constructor, Banner will try to create new layer automatically.
									if (event.detail) {

										// Look for layer key and do manipulations with data layers.
										switch (event.detail.key) {

											// Look for sequence layer.
											case 'SQ':

												// Apply custom HTML adjustments before creating sequence layer.
												// Duplicate sequence frames (in case you don't have all elements set manually in HTML).
												cloneDomElement(event.detail.parent.getTarget(event.detail.key), event.detail.key, event.detail.data.frames.length);

												// Check if banner is in debug mode and we are able to jump to another frame.
												if (layer.root.props.mode.get() === 'debug' && editor.jump) {

													// Try to set sequence frame to the one selected in content editor.
													event.detail.data.params.play.from = editor.frame;

													// Check if some element is selected in content editor.
													if (!utils.isEmptyString(editor.scope[1])) {

														// Pause sequence after start so frames change only on swipe event.
														event.detail.data.params.pause.after.time = 0;

													}

												}

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

										}

									}

									return;

								// If layer was successfully initialised.
								case ('init'):

									var

										/**
										 * @type {String}
										 */
										mode_name = 'mode_' + layer.props.mode.get();

									// Add "mode_debug" attribute to root layer in order to highlight layer bounds.
									layer.addAttr(mode_name, { name: mode_name, global: true });

									// Check if banner is in debug mode.
									if (layer.props.mode.get() === 'debug') {

										// Bind mouse over event.
										layer.events.mouseover_custom = utils.addEventSimple(layer.target, 'mouseover', function () {

											// Remove "mode_debug" attribute from root layer to release debug view on banner mouse over.
											layer.removeAttr(mode_name);

										});

										// Bind mouse out event.
										layer.events.mouseout_custom = utils.addEventSimple(layer.target, 'mouseout', function () {

											// Add "mode_debug" attribute to root layer in order to highlight layer bounds.
											layer.addAttr(mode_name, { name: mode_name, global: true });

										});

									}

									// Now load primary banner layer.
									// Proper font load utility requires all layers to be initialised before banner load function.
									// This will allow banner to index fonts that are in use and preload those before appending texts.
									// Custom fonts have to be preloaded in order to avoid wrong text holder positioning and styling (kerning, line heights).
									layer.load();

									break;

								// In case Banner is loaded, means static assets like fonts and images are loaded.
								// By default, Banner won't wait for any assets unless you indicate those in Banner parameters.
								case ('load'):

									// Initialise all nested banner layers.
									// Execute method recursively on all nested banner layers and frames.
									layer.execute('init', false);

									// Check if Banner does not support CSS animation.
									// Check if Banner is in capture mode.
									if (layer.inanimate === true || (['capture', 'capture-image', 'capture-gif'].indexOf(layer.props.mode.get()) !== -1)) {

										// Add "anim_no" attribute to root layer in order to stop all transitions.
										// NB! Required for proper snapshot capture, as PhantomJS does not support CSS animations.
										layer.addAttr('anim_no');

									}

									// Check if Banner is in image capture mode, means snapshot can be taken on dedicated stopping frame.
									if ((['capture', 'capture-image'].indexOf(layer.props.mode.get()) !== -1)) {

										// Stop banner (will display stopping frame).
										layer.stop();

									}

									// Add "ready" attribute to root layer. Will reveal banner contents.
									layer.addAttr('ready');

									break;

								// In case if banner is resized.
								case ('resize'):

									// Check if banner is responsive.
									if (container.NAME === 'RxR') {

										// Hide banner.
										layer.removeAttr('ready');

										// Destroy all layers.
										layer.execute('destroy', false);

										// Initialise layers again.
										layer.execute('init', false);

										// Reveal banner.
										layer.addAttr('ready');

									}

									break;

								// In case Banner is interacted.
								case ('interaction'):

									// Remove "anim_no_dur" attribute to root layer in order to reveal animations.
									layer.removeAttr('anim_no_dur');

									break;

								// In case Banner is stopped.
								// NB! Creative will stop automatically in 30 seconds. This is required by the most ad networks.
								case ('stop'):

									// Check if no user interaction spotted and banner is not in debug mode.
									if (!layer.interacted && layer.props.mode.get() !== 'debug') {

										// Add "anim_no_dur" attribute to root layer in order to make all transitions seamless.
										layer.addAttr('anim_no_dur');

									}

									// Pause all banner playbacks and sequences.
									// Execute method recursively on all nested banner layers and frames.
									// Ignore stop on parameter if in debug mode.
									layer.execute('stop', false, [(layer.props.mode.get() === 'debug' || layer.interacted)]);

									// Check if Banner is in image capture mode.
									if (['capture', 'capture-image'].indexOf(layer.props.mode.get()) !== -1) {

										// Execute snapshot capture with a delay, in order to give time to load necessary assets.
										layer.capture({ delay: 1000 });

									}

									break;

							}

							break;

						// In case it is primary sequence.
						case ('SQ'):

							// Check what happened.
							switch (event.type) {

								// If layer was initialised.
								case ('init'):

									// Check if layer is playable.
									if (layer.playable()) {

										// Play sequence layer.
										layer.play();

									}

									break;

								// If sequence paused.
								case ('pause'):

									// Stop entire banner.
									layer.root.stop();

									break;

								// If sequence frame has changed.
								case ('change'):
									if (layer.current.macros.local.SQ_layout === 'default') {
										layer.parent.removeAttr('SQ_layout_partner');
									} else {
										layer.parent.addAttr('SQ_layout_partner');
									}

									// Invoke sequence load processes on every frame change.
									// Function will decide which frames have to be loaded depending on parameters and execute load command on all nested layers.
									// Default setup will pre-load next frame in advance.
									layer.load();

									// Check if Banner is in gif or video capture mode, means snapshot has to be taken.
									// Check if duration is positive.
									if ((['capture-video', 'capture-gif'].indexOf(layer.root.props.mode.get()) !== -1) && layer.current.params.duration >= 1000) {

										// Execute frame capture.
										layer.root.capture({ delay: (layer.current.params.duration / 2), duration: layer.current.params.duration });

									}

								/*// Apply frame index to control static animations from CSS.
								try {

									if (layer.previous) {

										// Expand background layer.
										layer.removeAttr('SQ_frame_' + layer.previous.index);

									}

									if (layer.current) {

										// Expand background layer.
										layer.addAttr('SQ_frame_' + layer.current.index);

									}

								} catch (e) {
								}*/

								// Set sequence position depending on state.
								// try {

								// 	layer.target.style.left = -(layer.current.index * layer.width()) + 'px';

								// } catch (e) {
								// }

								// break;

							}

							break;

						// In case of all other layers.
						default:

							// Look for event type.
							switch (event.type) {

								// If layer was initialised.
								case ('set'):

									// Add hidden attribute.
									layer.addAttr('hidden');

									break;

								// If layer was initialised.
								case ('init'):

									// Check if layer can be loaded.
									// We don't want to load all frames of the sequence by default.
									if (layer.loadable()) {

										// Load layer.
										layer.load();

									}

									// Look for layers key.
									switch (layer.key) {

										// Look for needed layer keys.
										case 'SQ_0':
										case 'SQ_1':
										case 'SQ_2':
										case 'SQ_3':
										case 'SQ_4':
										case 'SQ_5':

											// try {

											// 	// Set frame position depending on it's position in sequence.
											// 	layer.target.style.left = (layer.index * layer.width()) + 'px';

											// } catch (e) {
											// }


											break;

										// Look for click layer.
										case 'CL':

											var

												/**
												 * @type {(tactic.builder.layers.SequenceLayer)}
												 */
												SQ_layer = layer.root.getLayer('SQ', 2);

											// Check if sequence layer is available.
											if (SQ_layer) {

												// Bind banner mouse or touch move event on body.
												// NB! This requires Banner instance to be initialised.
												layer.gestures.gesture_custom = new utils.GestureListener(layer.target, function (action, event, start_event) {

													var

														/**
														 * @type {Number}
														 */
														offset = -((start_event.pageX || start_event.clientX) - (event.pageX || event.clientX));

													// Check if offset is valid.
													if ((SQ_layer.current.index >= (SQ_layer.frames.length - 1) && offset < 0) || (SQ_layer.current.index <= 0 && offset > 0)) {

														// Delete offset value.
														offset = 0;

													}

													switch (action) {

														// If element was moved.
														case ('click'):

															// Trigger click event, pass current frame number.
															clickEventHandler(layer, SQ_layer.current.clicktag.url);

															// Pause sequence.
															SQ_layer.pause();

															break;

														// If element was moved.
														case ('start'):

															// Pause sequence.
															SQ_layer.pause();

															// Add identifier that gesture is happening.
															SQ_layer.addAttr('move');

															break;

														// If element was moved.
														case ('move'):

															// Check if sequence has layers.
															if (SQ_layer.frames.length > 1) {

																// Set sequence displacement.
																//SQ_layer.target.style.left = -(SQ_layer.current.index * SQ_layer.width()) + offset + 'px';

															}

															break;

														// If element move was stopped.
														case ('stop'):

															// Remove identifier that gesture is happening.
															SQ_layer.removeAttr('move');

															// Check if sequence has layers.
															if (SQ_layer.frames.length > 1) {

																// If no swipe action detected.
																if (offset < -50) {

																	// Change sequence to next frame.
																	SQ_layer.changeNext();

																}

																// If swiped right.
																else if (offset > 50) {

																	// Change sequence to previous frame.
																	SQ_layer.changePrevious();

																}

																else {

																	// // Change sequence to current frame.
																	// SQ_layer.change(SQ_layer.current.index);

																	// // Set sequence position depending on state.
																	// try {

																	// 	SQ_layer.target.style.left = -(SQ_layer.current.index * layer.width()) + 'px';

																	// } catch (e) {
																	// }

																}

															}

															break;

													}

												});

											}

											// If sequence is not defined.
											else {

												// Bind banner click event on click layer.
												// NB! This requires Banner instance to be initialised.
												layer.events.click_custom = utils.addEventSimple(document.body, 'click', function () {

													// Trigger click event, do not pass frame number.
													clickEventHandler(layer);

												});

											}

											break;

									}

									break;

								// If layer was initialised.
								case ('parsed'):

									// Look for layers key.
									switch (layer.key) {


										// Look for message layer.
										case 'MS':

											try {

												var

													/**
													 * @type {String}
													 */
													MS_macros_local = layer.macros.local;

												// // If you want to control presets from the banner, but not the content editor.
												// // Check if predefined values have to be set.
												// if (MS_macros_local['MS_position'] !== 'custom') {
												//
												// 	var
												//
												// 		/**
												// 		 * @type {Array}
												// 		 */
												// 		MS_position = MS_macros_local['MS_position'].split('_');
												//
												// 	// Reset default values.
												// 	MS_macros_local['MS_width'] = MS_position[0];
												// 	MS_macros_local['MS_height'] = MS_position[1];
												// 	MS_macros_local['MS_top'] = MS_position[2];
												// 	MS_macros_local['MS_left'] = MS_position[3];
												//
												// }

												// Validate horizontal alignment.
												MS_macros_local['MS_align_auto_h'] = MS_macros_local['MS_left'] < -50 ? 'left' : (MS_macros_local['MS_left'] > 50 ? 'right' : 'center');

												// Validate vertical alignment.
												MS_macros_local['MS_align_auto_v'] = MS_macros_local['MS_top'] < -50 ? 'top' : (MS_macros_local['MS_top'] > 50 ? 'bottom' : 'middle');

											} catch (e) {
											}

											break;

										case 'LD':

											try {
													var
														/**
															* @type {String}
														*/
													LD_macros_local = layer.macros.local;

													LD_macros_local.LD_type = utils.isUrl(layer.root.macros.global.dealership_source) ? 'image' : 'text';

											} catch (e) {
											}
											break;

									}

									break;

								// If layer was initialised.
								case ('enabled'):

									// Add "disabled" attribute to hide layer.
									layer.removeAttr('disabled');

									switch (layer.key) {

										// Look for needed layer keys.
										case 'FG_IMG':

											try {

												if (!layer.layers[0]) {

													// Add empty layer class to the sequence.
													layer.parent.parent.addAttr(layer.key.split('_')[0] + '_empty', { name: layer.key.split('_')[0] + '_empty', global: true });

												}

											} catch (e) {
											}

											break;

									}

									break;

								// If layer was successfully loaded or entered.
								case ('load'):
								case ('enter'):

									// Check if layer is available.
									// Will return false if sequenced and not on current frame.
									if (layer.available()) {

										// Check if banner is in debug mode.
										if (layer.root.props.mode.get() === 'debug' && layerIsSelected(layer)) {

											// Add debug mode attribute to layer.
											layer.addAttr('debug');

										}

										// Add animation class to fade in.
										layer.addAttr('active');

										// Remove hidden attribute.
										layer.removeAttr('hidden');

										var

											/**
											 * @type {Boolean}
											 */
											next_layer_identical = layerSourceIsIdentical(layer, -1);

										// Loop all animations.
										utils.each(layer.getAnims(),

											/**
											 * @param {Object} anim
											 * @param {String} anim_key
											 */
											function (anim, anim_key) {

												var

													/**
													 * @type {tactic.builder.layers.AbstractLayer}
													 */
													anim_layer = anim.target,

													/**
													 * @type {String}
													 */
													anim_name = anim.name,

													/**
													 * @type {Object}
													 */
													anim_end_event = anim_layer.events.anim_end,

													/**
													 * @type {Boolean}
													 */
													anim_apply = true;

												// Check if animation end event exists.
												if (anim_end_event) {

													// Remove animation end event.
													utils.removeEventSimple(anim_end_event.target, anim_end_event.type, anim_end_event.callback);
												}

												// Check if animation can be applied.
												if (anim_apply) {

													// Check if animation can be skipped.
													if (next_layer_identical && anim.skip) {

														// Add animation class to fade in.
														anim_layer.addAttr(anim_name + '_skip');

													} else {

														// // Remove animation class to fade in.
														anim_layer.removeAttr(anim_name + '_skip');

													}

													// Add animation class to fade in.
													anim_layer.removeAttr(anim_name + '_out');

													// Add animation class to fade in.
													anim_layer.addAttr(anim_name + '_in');

												}

											}

										);

										// Look for layers key.
										switch (layer.key) {

											// Look for needed layer keys.
											case 'LG':

												try {

													// Add logo type to sequence.
													layer.root.getLayer('WR', 1).addAttr('LG_type_' + layer.getMacros()['LG_type']);

												} catch (e) {
												}

												break;

											// Look for background video layer.
											// Hide background image if video asset has been shown.
											case 'BG_VID_0':

												try {

													// Hide poster image, class is defined in manifest.
													layer.wrapper.getLayer('BG_IMG_0', 1).addAttr('BG_anim_fade_out');

												} catch (e) {
												}

												break;

											// Look for needed layer keys.
											case 'SQ_0':
											case 'SQ_1':
											case 'SQ_2':
											case 'SQ_3':
											case 'SQ_4':
											case 'SQ_5':

												try {

													var

														/**
														 * @type {(tactic.builder.layers.JointLayer)}
														 */
														LG_layer = layer.root.getLayer('LG', 2),

														/**
														 * Select prioritised theme.
														 * @type {String}
														 */
														SQ_theme = (layer.macros.local['SQ_theme'] === 'default' ? layer.root.getLayer('CV').macros.local['CV_theme'] : layer.macros.local['SQ_theme']);

													// Check theme color.
													if (utils.arrayContains(['_theme_white'], '_theme_' + SQ_theme)) {

														LG_layer.removeAttr('LG_color_text_white_icon_yellow');
														LG_layer.addAttr('LG_color_text_blue_icon_yellow');

													}

													else if (utils.arrayContains(['_theme_black', '_theme_blue'], '_theme_' + SQ_theme)) {

														// Make logotype white yellow.
														LG_layer.addAttr('LG_color_text_white_icon_yellow');
														LG_layer.removeAttr('LG_color_text_blue_icon_yellow');

													}

													else {

														// Make logotype blue white.
														LG_layer.removeAttr('LG_color_text_white_icon_yellow');
														LG_layer.removeAttr('LG_color_text_blue_icon_yellow');

													}

												} catch (e) {
												}

												break;

										}

									}

									break;

								// If layer is entered.
								case ('leave'):

									var

										/**
										 * Check if layer source is identical to next frame.
										 * @type {Boolean}
										 */
										prev_layer_identical = layerSourceIsIdentical(layer, 1);

									// Loop all animations.
									utils.each(layer.getAnims(),

										/**
										 * @param {Object} anim
										 * @param {String} anim_key
										 */
										function (anim, anim_key) {

											var

												/**
												 * @type {tactic.builder.layers.AbstractLayer}
												 */
												anim_layer = anim.target,

												/**
												 * @type {String}
												 */
												anim_name = anim.name,

												/**
												 * @type {Object}
												 */
												anim_end = anim_layer.events.anim_end,

												/**
												 * @type {Boolean}
												 */
												anim_apply = true,

												/**
												 * Remove animation attributes when transition ends.
												 * @function
												 */
												removeAnimEndListener = function () {

													// Check if animation end event exists.
													if (anim_end) {

														// Remove load event listener.
														utils.removeEventSimple(anim_end.target, anim_end.type, anim_end.callback);

													}

												},

												/**
												 * Remove animation attributes when transition ends.
												 * @function
												 */
												animEndHandler = function () {

													removeAnimEndListener();

													// // Remove animation class to fade in.
													// anim_layer.removeAttr(anim_name + '_out');
													//
													// // Add hidden attribute.
													// anim_layer.addAttr('hidden');

												};

											// Clear animation end event listener.
											removeAnimEndListener();

											// Check if animation can be applied.
											if (anim_apply) {

												// Check if previous layer is identical.
												if (prev_layer_identical && anim.skip) {

													// // Remove animation class to fade in.
													anim_layer.addAttr(anim_name + '_skip');

												} else {

													// // Remove animation class to fade in.
													anim_layer.removeAttr(anim_name + '_skip');

												}

												// Add animation class to fade in.
												anim_layer.removeAttr(anim_name + '_in');

												// Add animation class to fade in.
												anim_layer.addAttr(anim_name + '_out');

												// Look for layers key.
												switch (layer.key) {

													// Look for foreground layer.
													case 'FG_IMG_0':

														// Do nothing here as we control this animation from CSS in the template.

														break;

													default:

														// Listen for animation end event.
														anim_layer.events.anim_end = utils.addEventSimple(anim_layer.target, whichTransitionEndEvent(), animEndHandler);

														break;

												}

											}

										}

									);

									// Remove active class.
									layer.removeAttr('active');

									// Remove debug class.
									layer.removeAttr('debug');

									break;

								// If layer is empty.
								case ('empty'):

									// Add "empty" attribute to hide layer.
									layer.addAttr('empty');

									// Add empty attribute to the frame layer, so other layers know the scope.
									// NB! Important layers has to go on top in the data.
									try {

										var

											/**
											 * @type {String}
											 */
											empty_key,

											/**
											 * @type {String}
											 */
											empty_holder_key,

											/**
											 * @type {tactic.builder.layers.AbstractLayer}
											 */
											empty_holder_layer;

										switch (layer.key) {

											case 'MS_TXT_0':

												empty_key = 'TL';
												empty_holder_key = 'MS';

												break;

											case 'MS_TXT_1':

												empty_key = 'DS';
												empty_holder_key = 'MS';

												break;

											case 'MS_TXT_2':

												empty_key = 'PR';
												empty_holder_key = 'MS';

												break;

											case 'MS_TXT_3':

												empty_key = 'BT';
												empty_holder_key = 'MS';

												break;

										}

										// Check if holder key identified.
										if (empty_holder_key) {

											empty_holder_layer = layer.getLayer(empty_holder_key, -3);

											// Check if holder layer found.
											if (empty_holder_key) {

												// Add empty layer class to the sequence.
												empty_holder_layer.parent.addAttr(empty_key + '_empty', { name: empty_key + '_empty', global: true });

											}

										}

									} catch (e) {
									}

									break;

								// If layer is disabled.
								case ('disabled'):

									// Add "disabled" attribute to hide layer.
									layer.addAttr('disabled');

									// Add disabled attribute to the frame layer, so other layers know the scope.
									// NB! Important layers have to go on top in the data.
									try {

										var

											/**
											 * @type {String}
											 */
											disabled_key,

											/**
											 * @type {String}
											 */
											disabled_holder_key,

											/**
											 * @type {tactic.builder.layers.AbstractLayer}
											 */
											disabled_holder_layer;

										switch (layer.key) {

											case 'LS':
											case 'FG':
											case 'BG':
											case 'MS':
											case 'TL':
											case 'DS':
											case 'PR':
											case 'OL':
											case 'BT':

												// Define disabled holder layer.
												disabled_holder_layer = layer;

												// Define disabled holder key.
												disabled_key = disabled_holder_key = layer.key;

												break;

											// Look for needed layer keys.
											case 'TL_TXT_0':
											case 'DS_TXT_0':
											case 'PR_TXT_0':
											case 'BT_TXT_0':

												// Define disabled holder layer.
												disabled_holder_layer = layer.getLayer(disabled_holder_key, -3);

												// Define disabled holder key.
												disabled_key = disabled_holder_key = layer.key.split('_')[0];

												break;

										}

										// Check if holder key identified.
										if (disabled_holder_key) {

											// Check if holder layer found.
											if (disabled_holder_key) {

												// Add empty layer class to the sequence.
												disabled_holder_layer.parent.addAttr(disabled_key + '_disabled', { name: disabled_key + '_disabled', global: true });

											}

										}

									} catch (e) {
									}

									break;

							}

							break;

					}

				}

			},

			/**
			 * @type {Object}
			 */
			editor = {};

		// Wait for TACTIC container initialisation ready scope event.
		// Start banner initialisation when container is ready, but wait with element build before fonts are loaded.
		container.ready(

			/**
			 * @param {Object} data
			 * @param {Object} data.editor
			 * @param {Object} data.banner
			 */
			function (data) {

				// Bind error event on window.
				utils.addEventSimple(window, 'error', errorEventHandler);

				// Bind error event on body.
				utils.addEventSimple(document.body, 'error', errorEventHandler);

				// Set editor scope data.
				editor = data.editor;

				// Create new Banner instance(s).
				// Include Banner instance to window namespace for easy access from console.
				// All further events and actions will be handled with callback handler.
				utils.each((['BN']),

					/**
					 * @param {String} key
					 * @param {Number} count
					 */
					function (key, count) {

						// Create new Banner instance.
						// Duplicate date in case it is banner clone.
						// All further events and actions will be handled with callback handler.
						window[key] = new tactic.builder.layers.BannerLayer(key, data.banner, bannerEventHandler);

					}
				);

			}
		);

	})(tactic);
