;(function ( $, w, doc ) {

  'use strict';

  var a11yAccordion = {};

  a11yAccordion.NS = "a11yAccordion";
  a11yAccordion.AUTHOR = "Scott O'Hara";
  a11yAccordion.VERION = "1.0.2";
  a11yAccordion.LICENSE = "https://github.com/scottaohara/accessible-components/blob/master/LICENSE.md";

  // define the plug-in
  var accWidget  = '[data-action="is-accordion"]';

  $.fn.extend({

    a11yAccordion: function ( e ) {

      /*
        OPTIONS:

        add the following data attributes to their respected element
        to extend the accordion setup process

          container
            * data-showall="true"
                show all panels by default

            * data-multi-open="true"
                individual accordion can have multiple tabs
                open at once

          panel
            * data-showbydefault="true"
                show individual panel by default

            * data-tab-label="Your Label Here"
                set the text for the auto generated
                tab/trigger for this panel (only if the panel does not have
                a preceding heading element)

      */

      // setup global class variables
      var accTrigger    = '.accordion__trigger',
          accPanel      = '.accordion__panel';


      return this.each( function () {

        // set up variables specific to the each instance
        var id = this.id,
            $self = $('#' + id),
            // these two variables will be reused in various functions
            setFalse = { 'aria-selected': 'false', 'tabindex': '-1' },
            setTrue = { 'aria-selected': 'true', 'tabindex': '0' },


        genAcc = function () {

          // check to see if there are any accTriggers,
          // if not, they need to be generated
          if ( !$self.find('> ' + accTrigger).length ) {

            // start a counter
            var $panelNum = 1;

            // find the panels within this accordion instance
            $self.find('> ' + accPanel).each( function () {
              var $this = $(this);

              // now create an ID based on the instance ID + _panel_ + a randomly generated #
              $this.attr('id', id + '_panel_' + $panelNum );

              // now grab that ID for later
              var $grabID = $this.attr('id'),

                // The expected mark-up for a no-js accordion should have a heading
                // before each tab panel. So if that exists, then grab the text
                // from that heading to use as the tab trigger label
                // OR if a heading isn't there, check to see if a data-tab-label was
                // set to the tab-panel.
                // IF both of those checks fail, then just call it "tab" + it's
                // # designation in the tab panel set
                $grabLabel = $this.prev(':header').text() || $this.attr('data-tab-label') || 'Tab ' + $panelNum,

                // Put it all together as a new <li>tab</li>
                $createTabItem = '<button type="button" data-href="#'+$grabID+'" class="accordion__trigger">'+$grabLabel+'</button>';

                $this.before($createTabItem);

              return $panelNum = $panelNum + 1;

            });

          }

        }, // end genAcc


        // setup the accordion and it's tabs and panels
        setupAcc = function () {

          // setup the component to have a role of tablist
          $self.attr({ 'role': 'tablist' });

          // if there was a heading set for the no-js solution (there should have been)
          // then it can be removed because we've already grabbed the text from it
          // for use in the auto generated <a>
          $self.find('> :header').remove();

          // if an accordion can have multiple panels opened at a time,
          // then add this aria attribute
          if ( $self.attr('data-multi-open') ) {

            $self.attr('aria-multiselectable', 'true');

          }


          // find the panel triggers within each instance
          // generate the appropriate attributes and values
          $self.find('> ' + accTrigger).each( function () {

            var $this = $(this),
                $getURL = $this.attr('href') || $this.attr('data-href'),
                $thisTarget = $getURL.split('#')[1];

            $this.attr({
              'aria-controls': $thisTarget,
              'aria-expanded': 'false',
              'aria-selected': 'false',
              'id': $thisTarget + '_tab',
              'role': 'tab',
              'tabindex': '-1'
            });

          }); // end $self.find(accTrigger).each


          // setup the panels
          $self.find('> ' + accPanel).each( function () {

            var $this = $(this);

            // setup panel to have appropriate attribute hooks
            $this.attr({
              'aria-hidden': 'true',
              'aria-labelledby': $this.before().attr('id') + '_tab',
              'role': 'tabpanel'
            });

            // if a panel should be shown by default,
            // update the aria-expanded attribute and .show() it.
            // then update the paired trigger's attributes to
            // show it as active/selected
            if ( $this.attr('data-showbydefault') ) {

              // set the appropriate aria attribute values
              $this.attr({ 'aria-hidden': 'false' }).show(); // show this by default

              // and set the corresponding trigger to have
              // the correct attribute values as well
              $this.prev(accTrigger).attr({
                'aria-expanded': 'true',
                'aria-selected': 'true',
                'tabindex': '0'
              }).addClass('is-active');

              // and finally, add a class to the parent
              // to mark it as an accordion that has a
              // default tab
              $this.parent().addClass('has-default');
            }

          }); // end $self.find(accPanel).each


          // if a default tab wasn't set, then the first tab
          // needs to be focusable in the tablist
          if ( !$self.hasClass('has-default') ) {

            $self.find('> ' + accTrigger + ':first-of-type').attr({ 'tabindex': '0' });

          }

        }, // end setupAcc



        // show all panel resetup
        showAllSetup = function () {

          if ( $self.attr('data-showall') === 'true' ) {

            $self.find('> ' + accTrigger).attr('aria-expanded', 'true');
            $self.find('> ' + accPanel).attr('aria-hidden', 'false').show();
            $self.find('> ' + accTrigger).first().attr('aria-selected', 'true').addClass('is-active');

          }

        },




        // on panel click
        panelClick = function ( e ) {

          e.stopPropagation();

          var $e = $(e.target).closest(accPanel),
              $getTarget = $e.attr('aria-labelledby'),
              $target = $('#'+$getTarget);


          $self.find('> ' + accTrigger).attr(setFalse).removeClass('is-active');


          // run the check expanded function
          checkExpanded();


          $target.attr(setTrue).addClass('is-active').removeClass('was-active');

        },


        // check to see if a panel was previously expanded
        // as that means it used to be active, and we'll
        // need this class for later
        checkExpanded = function () {

          $self.find('> ' + accTrigger).each( function () {

            var $this = $(this);

            if ( $this.attr('aria-expanded') === 'true' ) {

              $this.addClass('was-active');

            }

          });

        },


        // trigger logic
        panelReveal = function ( e ) {

          // prevent browser jumping and the URI being
          // added to the browser's address bar
          e.preventDefault();

          var $e = $(e.target),
              $getTarget = $e.attr('aria-controls'),
              $target = $('#'+$getTarget);


          // run a check to see if the multiOpen flag is up
          // if not, then when a new tab is opened, previously
          // opened tags need to close
          if ( !$self.attr('data-multi-open') ) {

            $self.find('> ' + accTrigger).attr({
              'aria-selected': 'false',
              'aria-expanded': 'false',
              'tabindex': '-1'
            });

            $self.find('> ' + accPanel).attr({ 'aria-hidden': 'true' }).slideUp();

          }


          // run the check expanded function
          checkExpanded();


          // if a tab was previously active, if it is clicked again
          // it needs to close, but still become the currently active
          // and tabindexable element
          if ( $e.hasClass('was-active') ) {

            $self.find('> ' + accTrigger).removeClass('is-active').attr(setFalse);

            $e.attr({
              'aria-expanded': 'false',
              'aria-selected': 'true',
              'tabindex': '0'
            }).removeClass('was-active').focus();

            $target.attr('aria-hidden', 'true').slideUp();

            return;

          }


          // regardless of if multiOpen is true or false,
          // if the target trigger has a class of is-active,
          // and a user activates it again, then it should
          // close that panel and deactivate the tab
          if ( $e.hasClass('is-active') ) {

            $e.attr({
              'aria-expanded': 'false',
              'tabindex': '0'
            }).removeClass('is-active');

            $target.attr({ 'aria-hidden': 'true' }).slideUp();

            return;

          }


          else if ( !$e.hasClass('is-active') ) {

            $self.find('> ' + accTrigger).removeClass('is-active').attr(setFalse);

            $e.attr({
              'tabindex': '0',
              'aria-selected': 'true',
              'aria-expanded': 'true'
            }).addClass('is-active').focus();

            $target.attr({ 'aria-hidden': 'false' }).slideDown();

            return;

          }

        },



        // tab/trigger keyboard controls
        keytrolls = function ( e ) {

          var keyCode = e.which,
              $grabThisTrigger,
              $currentTabItem;

          // are we in the tab/headings or inside a panel?
          if ( $(e.target).attr('role') === 'tab' ) {
            $currentTabItem = $(e.target);
          }
          else if ( $(e.target).closest(accPanel) ) {
            $grabThisTrigger = $(e.target).closest(accPanel).attr('aria-labelledby'),
            $currentTabItem = $('#'+$grabThisTrigger);
          }


          // now that we know what our currentTabItem/Accordion are
          // we can set up some more variables
          var $currentAccordion = $currentTabItem.parent(),
              $firstTab = $currentAccordion.find('> ' + accTrigger).first(),
              $lastTab = $currentAccordion.find('> ' + accTrigger).last(),
              $prevTab = $currentTabItem.prev().prev(),
              $nextTab = $currentTabItem.next().next()


          if ( $currentTabItem.is(accTrigger + ':first-of-type') ) {
            $prevTab = $lastTab;
          }
          else if ( $currentTabItem.is(accTrigger + ':last-of-type') ) {
            $nextTab = $firstTab;
          }


          // now there are different keyboard controls for our different situations
          if ( $(e.target).attr('role') === 'tab' ) {

            switch ( keyCode ) {

              // right + down
              case 39: // right
              case 40: // down
                e.preventDefault();
                $currentTabItem.attr(setFalse);
                $nextTab.focus().attr(setTrue);
                break;

              // left + up
              case 37: // left
              case 38: // up
                e.preventDefault();
                $currentTabItem.attr(setFalse);
                $prevTab.focus().attr(setTrue);
                break;

              case 35: // end
                e.stopPropagation();
                $lastTab.focus().attr(setTrue);
                break;

              case 36: // home
                e.stopPropagation();
                $firstTab.focus().attr(setTrue);
                break;

              default:
                break;

            } // end switch


          if ( $(e.target).is('a') ) {
            switch ( keyCode ) {
              case 13: // enter
              case 32: // space bar
                e.stopPropagation();
                panelReveal( e );
                break;
            }
          }
          else if ( $(e.target).is('button') ) {
            switch ( keyCode ) {
              case 13: // enter
                e.stopPropagation();
                panelReveal( e );
                break;
            }
          }


          } // end if

          else if ( $(e.target).closest(accPanel) ) {

            if ( e.ctrlKey ) {

              e.preventDefault(); // prevent default behavior

              switch ( e.keyCode ) {
                case 38: // up
                  $currentTabItem.focus();
                  break;

                case 33: // pg up
                  $self.find('> ' + accTrigger).attr(setFalse);
                  $prevTab.focus().attr(setTrue);
                  break;

                case 34: // pg down
                  $self.find('> ' + accTrigger).attr(setFalse);
                  $nextTab.focus().attr(setTrue);
                  break;

                default:
                  break;
              } // end switch

            } // end if

          } // end else if

        };


        // Run setups on load
        genAcc();
        setupAcc();
        showAllSetup();


        // Events
        $self.find('> ' + accTrigger).on( 'click', panelReveal.bind(this) );
        $self.find('> ' + accPanel).on( 'click', panelClick.bind(this) );
        $self.find('> ' + accTrigger).on( 'keydown', keytrolls.bind(this) );
        $self.find('> ' + accPanel).on( 'keydown', keytrolls.bind(this) );

      }); // end: return this.each()
    }

  });  // end $.fn.extend

  // call it
  $(accWidget).a11yAccordion();

})( jQuery, this, this.document );
