;(function ( w, doc, undefined ) {
  // enable strict mode
  'use strict';

  /**
   * Local object for method references
   * and define script meta-data
   */
  var ARIAaccordion = {};
  w.ARIAaccordion   = ARIAaccordion; // make functions available outside of iffe

  ARIAaccordion.NS      = "ARIAaccordion";
  ARIAaccordion.AUTHOR  = "Scott O'Hara";
  ARIAaccordion.VERSION = "2.0.0";
  ARIAaccordion.LICENSE = "https://github.com/scottaohara/accessible-components/blob/master/LICENSE.md";

  var widgetTrigger = 'accordion__trigger';
  var widgetHeading = 'accordion__heading';
  var widgetPanel   = 'accordion__panel';

  /**
   * Global Create
   *
   * This function validates that the minimum
   * required markup is present to create the
   * ARIA widget(s). Any additional markup elements
   * or attributes that do not exist in the found
   * required markup patterns will be generated
   * via this function.
   */
  ARIAaccordion.create = function () {
    // setup / cache vars
    var self;
    var panels;
    var defaultPanel = 'none';
    var headings;
    var triggers;
    var constantPanel;
    var multiPanel;
    var i;

    var widget = doc.querySelectorAll('[data-aria-accordion]');

    for ( i = 0; i < widget.length; i++ ) {
      var t;
      // easy ref for widget
      self = widget[i];

      /**
       * Check for IDs and create arrays of necessary
       * panels & headings for further setup functions
       */
      if ( !self.hasAttribute('id') ) {
        self.id = 'acc_' + Math.floor(Math.random() * 999) + 1;
      }

      // get all panels & headings of an accordion pattern based
      // on a specific ID > direct child selector (this will ensure that
      // nested accordions don't get properties meant for the parent
      // accordion, or vice-versa)
      panels = doc.querySelectorAll('#' + self.id + ' > .' + widgetPanel);
      headings = doc.querySelectorAll('#' + self.id + ' > .' + widgetHeading);

      /**
       * Check for options:
       * data-default - is there a default opened panel?
       * data-constant - should the accordion always have A panel open?
       */
      // does the accordion have a default panel set?
      if ( self.hasAttribute('data-default') ) {
        defaultPanel = self.getAttribute('data-default');
      }

      // accordions with a constantly open panel are not a default
      // but if a data-constant attribute is used, then we need this
      // to be true
      constantPanel = self.hasAttribute('data-constant');

      // accordions can have multiple panels open at a time,
      // if they have a data-multi attribute
      multiPanel = self.hasAttribute('data-multi');


      /**
       * Setup Panels, Headings & 'Buttons'
       */
      ARIAaccordion.setupPanels( self.id, panels, defaultPanel, constantPanel );
      ARIAaccordion.setupHeadingButton( headings, constantPanel );
      // ARIAaccordion.setupEvents( );

      triggers = doc.querySelectorAll('#' + self.id + ' > .' + widgetHeading + ' .' + widgetTrigger);

      // Now that the headings/triggers and panels are setup
      // we can grab all the triggers and setup their functionality
      // var triggers = self.querySelectorAll('.'+widgetTrigger);
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

      // set the accordion to have the appropriately
      // opened panel if a data-default value is set.
      // if no value set, then no panels are open
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

      // if an accordion is meant to have a perpetually open panel,
      // and a default open panel was not set (or not set correctly),
      // then run one more check
      if ( constant && setPanel === 'none' || parseInt(setPanel) === NaN ) {
        ariaHidden(panels[0], false);
      }
    }
  }; // ARIAaccordion.setupPanels



  ARIAaccordion.setupHeadingButton = function ( headings, constantPanel ) {
    var headings = headings;
    var heading;
    var targetID;
    var targetState;
    var newButton;
    var buttonText;
    var i;

    for ( i = 0; i < headings.length; i++ ) {
      heading     = headings[i];
      targetID    = heading.nextElementSibling.id; //
      targetState = doc.getElementById(targetID).getAttribute('aria-hidden');

      // setup new heading buttons
      newButton  = doc.createElement('button');
      buttonText = heading.textContent;
      // clear out the heading's content
      heading.innerHTML = '';

      newButton.setAttribute('type', 'button');
      newButton.setAttribute('aria-controls', targetID);
      newButton.setAttribute('id', targetID + '_trigger');
      newButton.classList.add(widgetTrigger);

      // check the corresponding panel to see if it was set up to
      // be hidden or shown by default. Add an aria-expanded
      // attribute value that is appropriate
      if ( targetState === 'false' ) {
        newButton.setAttribute('aria-expanded', 'true');
        newButton.setAttribute('data-current', 'true');

        // check to see if this an accordion that needs a constantly
        // opened panel, and if the button's target is not hidden
        if ( constantPanel ) {
          newButton.setAttribute('aria-disabled', 'true');
        }
      }
      else {
        newButton.setAttribute('aria-expanded', 'false');
        newButton.setAttribute('data-current', 'false');
      }

      // add the Button & previous heading text
      heading.appendChild(newButton);
      newButton.appendChild(doc.createTextNode(buttonText));
    }
  }; // ARIAaccordion.createButton


  ARIAaccordion.actions = function ( e ) {
    // need to pass in if this is a multi accordion or naw
    // also need to pass in existing trigger arrays
    var thisAccordion = this.id.replace(/_panel.*$/g, '');
    var thisTarget = doc.getElementById(this.getAttribute('aria-controls'));
    var thisTriggers = doc.querySelectorAll('#' + thisAccordion + ' > .' + widgetHeading + ' .' + widgetTrigger);
    var thisPanels;

    e.preventDefault();

    if ( doc.getElementById(thisAccordion).hasAttribute('data-multi') ) {
      ARIAaccordion.togglePanel( e, thisAccordion, thisTarget, thisTriggers );
    }
    else {
      thisPanels = doc.querySelectorAll('#' + thisAccordion + ' > .' + widgetPanel);
      ARIAaccordion.togglePanel( e, thisAccordion, thisTarget, thisTriggers );
      ARIAaccordion.closeAll( thisTriggers );
    }
  }; // ARIAaccordion.actions()


  ARIAaccordion.closeAll = function ( triggers ) {
    var i;
    var openPanel;
    var getID;

    for ( i = 0; i < triggers.length; i++ ) {


      if ( triggers[i].getAttribute('data-current') === 'true' ) {
        openPanel = triggers[i].getAttribute('aria-controls');
      }

      if ( triggers[i].getAttribute('data-current') === 'false' ) {
        ariaExpanded(triggers[i], false);

        if ( triggers[i].getAttribute('aria-expanded') === 'false' ) {
          getID = triggers[i].getAttribute('aria-controls');
          doc.getElementById(getID).setAttribute('aria-hidden', 'true');
        }
      }
    }
  }


  ARIAaccordion.togglePanel = function ( e, thisAccordion, targetPanel, triggers ) {
    var i;
    var thisAccordion = thisAccordion;
    var thisTrigger = e.target;

    for ( i = 0; i < triggers.length; i++ ) {
      triggers[i].setAttribute('data-current', 'false');
      triggers[i].removeAttribute('aria-disabled');
    }

    if ( doc.getElementById(thisAccordion).hasAttribute('data-constant') ) {
      ariaExpanded(thisTrigger, true);
      thisTrigger.setAttribute('aria-disabled', 'true');
      thisTrigger.setAttribute('data-current', 'true');
      ariaHidden(targetPanel, false);
    }
    else {
      if ( thisTrigger.getAttribute('aria-expanded') === 'true' ) {
        ariaExpanded(thisTrigger, false);
        thisTrigger.setAttribute('data-current', 'true');
        ariaHidden(targetPanel, true);
      }
      else {
        ariaExpanded(thisTrigger, true);
        thisTrigger.setAttribute('data-current', 'true');
        ariaHidden(targetPanel, false);
      }
    }
  }


  ARIAaccordion.keytrolls = function ( e ) {
    if ( e.target.classList.contains(widgetTrigger) ) {
      var keyCode = e.keyCode || e.which;

      // vars for keyboard keys
      var keyUp = 38;
      var keyDown = 40;
      var keyHome = 36;
      var keyEnd = 35;
      var keyTab = 9;

      var thisAccordion = this.id.replace(/_panel.*$/g, '');

      var thisTriggers = doc.querySelectorAll('#' + thisAccordion + ' > .' + widgetHeading + ' .' + widgetTrigger);

      // var idx = thisTriggers.length;
      var i;

      switch ( keyCode ) {
        case keyUp:
          if ( doc.getElementById(thisAccordion).hasAttribute('data-up-down') ) {
            e.preventDefault();
            // optional up arrow controls
          }
          break;

        case keyDown:
          if ( doc.getElementById(thisAccordion).hasAttribute('data-up-down') ) {
            e.preventDefault();
            // optional down arrow control
          }
          break;


        // should keyEnd/Home controls even exist?
        // they are optional functions that may not be inherently known
        // to most users and, in the case of END, conflict with expected
        // usage of that key via NVDA.
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
  }; // ARIAaccordion.init()


  /**
   * Helper Functions
   * Just to cut down on some redundant declarations
   */
  var ariaHidden = function ( el, state ) {
    el.setAttribute('aria-hidden', state);
  };

  var ariaExpanded = function ( el, state ) {
    el.setAttribute('aria-expanded', state);
  }

  // go go JavaScript
  ARIAaccordion.init();


})( window, document );
