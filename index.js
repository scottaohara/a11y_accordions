;(function ( w, doc, undefined ) {
	'use strict';

	/**
	 * Local object for method references
	 * and define script meta-data
	 */
	var ARIAaccordion = {};
	w.ARIAaccordion   = ARIAaccordion;

	ARIAaccordion.NS      = 'ARIAaccordion';
	ARIAaccordion.AUTHOR  = 'Scott O\'Hara';
	ARIAaccordion.VERSION = '3.2.1';
	ARIAaccordion.LICENSE = 'https://github.com/scottaohara/accessible_accordions/blob/master/LICENSE';

	var widgetClass   = 'accordion';
	var widgetTriggerClass = widgetClass + '__trigger';
	var widgetHeadingClass = widgetClass + '__heading';
	var widgetPanelClass = widgetClass + '__panel';

	var widgetHeading = '[data-aria-accordion-heading]';
	var widgetPanel   = '[data-aria-accordion-panel]'

	var idCounter = 0;

	/**
	 * Global Create
	 *
	 * This function validates that the minimum required markup
	 * is present to create the ARIA widget(s).
	 * Any additional markup elements or attributes that
	 * do not exist in the found required markup patterns
	 * will be generated via this function.
	 */
	ARIAaccordion.create = function () {
		var self;
		var panels;
		var defaultPanel = 'none';
		var headings;
		var triggers;
		var constantPanel;
		var multiPanel;
		var i;

		var widget = doc.querySelectorAll('[data-aria-accordion]');

		idCounter += 1;

		for ( i = 0; i < widget.length; i++ ) {
			self = widget[i];
			var t;

			/**
			 * Check for IDs and create arrays of necessary
			 * panels & headings for further setup functions.
			 */
			if ( !self.hasAttribute('id') ) {
				self.id = 'acc_' + idCounter + '-' + i;
			}

			/**
			 * Setup accordion classes
			 */
			self.classList.add(widgetClass);


			/**
			 * Get all panels & headings of an accordion pattern based
			 * on a specific ID > direct child selector (this will ensure
			 * that nested accordions don't get properties meant for
			 * the parent accordion, or vice-versa).
			 *
			 * If accordions are contained within an ol/ul, the selector
			 * needs to be different.
			 */
			if ( doc.querySelectorAll('#' + self.id + '> li').length ) {
				panels = doc.querySelectorAll('#' + self.id + ' li > ' + widgetPanel);
				headings = doc.querySelectorAll('#' + self.id + ' li > ' + widgetHeading);
			}
			else {
				panels = doc.querySelectorAll('#' + self.id + ' > ' + widgetPanel);
				headings = doc.querySelectorAll('#' + self.id + ' > ' + widgetHeading);
			}

			/**
			 * Check for options:
			 * data-default - is there a default opened panel?
			 * data-constant - should the accordion always have A panel open?
			 */
			if ( self.hasAttribute('data-default') ) {
				defaultPanel = self.getAttribute('data-default');
			}

			/**
			 * Accordions with a constantly open panel are not a default
			 * but if a data-constant attribute is used, then we need this
			 * to be true.
			 */
			constantPanel = self.hasAttribute('data-constant');

			/**
			 * Accordions can have multiple panels open at a time,
			 * if they have a data-multi attribute.
			 */
			multiPanel = self.hasAttribute('data-multi');

			/**
			 * If accordion panels are meant to transition, apply this inline style.
			 * This is to help mitigate a quick flash of CSS being applied to the
			 * no-js styling, and having an unwanted transition on initial page load.
			 */
			if ( self.hasAttribute('data-transition') ) {
				var thesePanels = self.querySelectorAll(widgetPanel);

				for ( t = 0; t < thesePanels.length; t++ ) {
					thesePanels[t].classList.add(widgetPanelClass + '--transition');
				}
			}

			/**
			 * Setup Panels, Headings & Buttons
			 */
			ARIAaccordion.setupPanels(self.id, panels, defaultPanel, constantPanel);
			ARIAaccordion.setupHeadingButton(headings, constantPanel);

			if ( doc.querySelectorAll('#' + self.id + '> li').length ) {
				triggers = doc.querySelectorAll('#' + self.id + ' li > ' + widgetHeading + ' .' + widgetTriggerClass);
			}
			else {
				triggers = doc.querySelectorAll('#' + self.id + ' > ' + widgetHeading + ' .' + widgetTriggerClass);
			}

			/**
			 * Now that the headings/triggers and panels are setup
			 * we can grab all the triggers and setup their functionality.
			 */
			for ( t = 0; t < triggers.length; t++ ) {
				triggers[t].addEventListener('click', ARIAaccordion.actions);
				triggers[t].addEventListener('keydown', ARIAaccordion.keytrolls);
			}
		} // for(widget.length)
	}; // ARIAaccordion.create()


	ARIAaccordion.setupPanels = function ( id, panels, defaultPanel, constantPanel ) {
		var i;
		var panel;
		var panelID;
		var setPanel;
		var constant;

		for ( i = 0; i < panels.length; i++ ) {
			panel = panels[i];
			panelID = id + '_panel_' + (i + 1);
			setPanel = defaultPanel;
			constant = constantPanel;

			panel.setAttribute('id', panelID);
			ariaHidden(panels[0], true);

			panel.classList.add(widgetPanelClass);

			/**
			 * Set the accordion to have the appropriately
			 * opened panel if a data-default value is set.
			 * If no value set, then no panels are open.
			 */
			if ( setPanel !== 'none' && parseInt(setPanel) !== NaN ) {
				// if value is 1 or less
				if ( setPanel <= 1 ) {
					ariaHidden(panels[0], false);
				}
				// if value is more than the number of panels, then open
				// the last panel by default
				else if ( (setPanel - 1) >= panels.length ) {
					ariaHidden(panels[panels.length - 1], false);
				}
				// for any other value between 2 - the last panel #, open that one
				else {
					ariaHidden(panels[(setPanel - 1)], false);
				}
			}

			/**
			 * If an accordion is meant to have a consistently open panel,
			 * and a default open panel was not set (or was not set correctly),
			 * then run one more check.
			 */
			if ( constant && setPanel === 'none' || parseInt(setPanel) === NaN ) {
				ariaHidden(panels[0], false);
			}
		}
	}; // ARIAaccordion.setupPanels


	ARIAaccordion.setupHeadingButton = function ( headings, constantPanel ) {
		var heading;
		var targetID;
		var targetState;
		var newButton;
		var buttonText;
		var i;

		for ( i = 0; i < headings.length; i++ ) {
			heading     = headings[i];
			targetID    = heading.nextElementSibling.id;
			targetState = doc.getElementById(targetID).getAttribute('aria-hidden');

			// setup new heading buttons
			newButton  = doc.createElement('button');
			buttonText = heading.textContent;
			// clear out the heading's content
			heading.innerHTML = '';
			// provide the heading with a class for styling
			heading.classList.add(widgetHeadingClass);

			newButton.setAttribute('type', 'button');
			newButton.setAttribute('aria-controls', targetID);
			newButton.setAttribute('id', targetID + '_trigger');
			newButton.classList.add(widgetTriggerClass);

			/**
			 * Check the corresponding panel to see if it was set up
			 * to be hidden or shown by default. Add an aria-expanded
			 * attribute value that is appropriate.
			 */
			if ( targetState === 'false' ) {
				ariaExpanded(newButton, true);
				isCurrent(newButton, true);

				/**
				 * Check to see if this an accordion that needs a constantly
				 * opened panel, and if the button's target is not hidden.
				 */
				if ( constantPanel ) {
					newButton.setAttribute('aria-disabled', 'true');
				}
			}
			else {
				ariaExpanded(newButton, false);
				isCurrent(newButton, false);
			}

			// Add the Button & previous heading text
			heading.appendChild(newButton);
			newButton.appendChild(doc.createTextNode(buttonText));
		}
	}; // ARIAaccordion.createButton


	ARIAaccordion.actions = function ( e ) {
		// Need to pass in if this is a multi accordion or not.
		// Also need to pass in existing trigger arrays.
		var thisAccordion = this.id.replace(/_panel.*$/g, '');
		var thisTarget = doc.getElementById(this.getAttribute('aria-controls'));
		var thisTriggers;

		if ( doc.querySelectorAll('#' + thisAccordion + '> li').length ) {
			thisTriggers = doc.querySelectorAll('#' + thisAccordion + ' li > ' + widgetHeading + ' .' + widgetTriggerClass);
		}
		else {
			thisTriggers = doc.querySelectorAll('#' + thisAccordion + ' > ' + widgetHeading + ' .' + widgetTriggerClass);
		}

		e.preventDefault();

		ARIAaccordion.togglePanel( e, thisAccordion, thisTarget, thisTriggers );
	}; // ARIAaccordion.actions()


	ARIAaccordion.togglePanel = function ( e, thisAccordion, targetPanel, triggers ) {
		var getID;
		var i;
		var thisTrigger = e.target;

		// check to see if a trigger is disabled
		if ( thisTrigger.getAttribute('aria-disabled') !== 'true' ) {

			getID = thisTrigger.getAttribute('aria-controls');

			isCurrent(thisTrigger, 'true');

			if ( thisTrigger.getAttribute('aria-expanded') === 'true' ) {
				ariaExpanded(thisTrigger, 'false');
				ariaHidden(targetPanel, 'true');
			}
			else {
				ariaExpanded(thisTrigger, 'true');
				ariaHidden(targetPanel, 'false');

				if ( doc.getElementById(thisAccordion).hasAttribute('data-constant') ) {
					ariaDisabled(thisTrigger, 'true');
				}
			}

			if ( doc.getElementById(thisAccordion).hasAttribute('data-constant') ||
					 !doc.getElementById(thisAccordion).hasAttribute('data-multi') ) {

				for ( i = 0; i < triggers.length; i++ ) {
					if ( thisTrigger !== triggers[i] ) {
						isCurrent(triggers[i], 'false');
						getID = triggers[i].getAttribute('aria-controls');
						ariaDisabled(triggers[i], 'false');
						ariaExpanded(triggers[i], 'false');
						ariaHidden(doc.getElementById(getID), 'true');
					}
				}
			}
		}
	};


	ARIAaccordion.keytrolls = function ( e ) {
		if ( e.target.classList.contains(widgetTriggerClass) ) {
			var keyCode = e.keyCode || e.which;

			// var keyUp = 38;
			// var keyDown = 40;
			var keyHome = 36;
			var keyEnd = 35;

			var thisAccordion = this.id.replace(/_panel.*$/g, '');
			var thisTriggers;

			if ( doc.querySelectorAll('#' + thisAccordion + '> li').length ) {
				thisTriggers = doc.querySelectorAll('#' + thisAccordion + ' li > ' + widgetHeading + ' .' + widgetTriggerClass);
			}
			else {
				thisTriggers = doc.querySelectorAll('#' + thisAccordion + ' > ' + widgetHeading + ' .' + widgetTriggerClass);
			}


			switch ( keyCode ) {
				/**
				 * keyUp & keyDown are optional controls
				 * for accordion components.
				 */
				// case keyUp:
				// 	if ( doc.getElementById(thisAccordion).hasAttribute('data-up-down') ) {
				// 		e.preventDefault();
				// 		// optional up arrow controls
				// 	}
				// 	break;

				// case keyDown:
				// 	if ( doc.getElementById(thisAccordion).hasAttribute('data-up-down') ) {
				// 		e.preventDefault();
				// 		// optional down arrow control
				// 	}
				// 	break;

				/**
				 * keyEnd/Home are optional functions that may not be inherently known
				 * to most users and, in the case of END, conflict with expected
				 * usage of that key with NVDA.
				 */
				case keyEnd:
					e.preventDefault();
					thisTriggers[thisTriggers.length - 1].focus();
					break;

				case keyHome:
					e.preventDefault();
					thisTriggers[0].focus();
					break;

				default:
					break;
			}
		}
	}; // ARIAaccordion.keytrolls()


	/**
	 * Initialize Accordion Functions
	 * if expanding this script, place any other
	 * initialize functions within here.
	 */
	ARIAaccordion.init = function () {
		ARIAaccordion.create();
	};


	/**
	 * Helper Functions
	 * Just to cut down on the verboseness of some declarations
	 */
	var ariaHidden = function ( el, state ) {
		el.setAttribute('aria-hidden', state);
	};

	var ariaExpanded = function ( el, state ) {
		el.setAttribute('aria-expanded', state);
	};

	var ariaDisabled = function ( el, state ) {
		el.setAttribute('aria-disabled', state);
	};

	var isCurrent = function ( el, state ) {
		el.setAttribute('data-current', state);
	};

	// go go JavaScript
	ARIAaccordion.init();

})( window, document );
