var hashParams = {};
var docroot = '';
getHashParams()

$(document).ready(function() {

  $.timeago.settings.allowFuture = true;

  if (hashParams.hasOwnProperty('badgedetail')) {
    var element = $('a[data-shortname="' + hashParams.badgedetail +'"]');
    makeModal($(element), true);
  }

  if (hashParams.hasOwnProperty('badgeaccept') && hashParams.hasOwnProperty('email')) {
    showPushModal(hashParams.badgeaccept, hashParams.email);
  }

  //the click function for lists of badge thumbnails
  $( 'body' ).delegate( "a", "click", function() {

    if($('.logged-out').length != 0) {
      makeAlert('Please <a class="button small" href="persona.html">log in</a> to make changes to your badges.','alert');
      return false;
    }
    var target = $( this );
    var hashOrAction = $( this ).attr('class').split(' ')[1];
    var ui = 0;
    if (target.hasClass('badgethumb')) { ui = 'badge'; } 
    else if (target.hasClass('collectionthumb')) { ui = 'collection'; }
    
    //Display badge content and BadgeUI for clicked badge
    if (ui != 0) {

      //check for other chosen items and close them
      if($('.chosen').length > 0 ) {
        $('.chosen').each(function(){
          if(!$(this).hasClass(hashOrAction)) {
            var thisTarget = $(this);
            $(this).find('.detail').animate({
              top: "150px"
            }, 400, "swing", function(){
              thisTarget.removeClass('chosen').parents('li').find('.ui').fadeOut('fast', function() {
                $(this).remove();
              });
            });
          }
        });
      }

      //for square thumbnal badges
      if(target.parents('ul').hasClass('square')){
        if (target.hasClass('chosen')) {
          $(target).find('.detail').animate({
            top: "150px"
          }, 400, "swing", function(){
            target.removeClass('chosen').parents('li').find('.ui').fadeOut('fast', function() {
              $(this).remove();
            });
          });
        } else {
          $(target).find('.detail').animate({
            top: "0px"
          }, 400, "swing", function(){
            ui = makeUI(target)
            target.addClass('chosen').parents('li').append(ui).find('.ui').fadeIn('fast');
          });
        }
      //for vertical thumbnail badges (in lists)
      } else if (target.parents('ul').hasClass('vertical')) {
        //SOMEB BUG HERE - WHEN YOU TOGGLE VISIBLE A BUNCH OF VERTICALS THEN TOGGLE INVISI ALL DISAPPEAR
        if (target.hasClass('chosen')) {
          target.removeClass('chosen').parents('li').find('.ui').fadeOut('fast', function() {
              $(this).remove();
            });
        } else {
          ui = makeUI(hashOrAction,ui)
          target.addClass('chosen').parent().append(ui).find('.ui').fadeIn('fast');
        }


      }
    return false;
    //Perform action based on clicked Badge UI item
    }
    else if (target.hasClass('badge_action')) {
      badgeAction(target);
      if(!target.hasClass('bcol')) return false;
    }
    else if (target.hasClass('collection_action')) {
      collectionAction(target);
      if(!target.hasClass('csha')) return false;
    }
    else if (target.hasClass('toggle')) {
      $('#'+hashOrAction).fadeToggle();
      return false;
    }
    else if (target.hasClass('claimtoggle')) {
      $(this).fadeOut('fast', function(){
        $('div.claimtoggle').fadeIn('fast');
      });

      return false;
    }
    else if (target.hasClass('claimbutton')) {
      claimAction();
    }
  });

  //a function to generate the dropdown BadgeUI from the clicked badge hash
  function makeUI(element) {
    var shortname = element.data('shortname');

    var output = '' +
                 '<div class="badgeui ui">' +
                 ' <ul>';

    if(element.hasClass('bgiv')) {
      output += '<li><a class="badge_action bgiv button small" data-shortname="' + shortname + '"href="#">Give</a></li>'
    }
    else {
      output += '<li><a class="badge_action bapp button small" data-shortname="' + shortname + '" href="#">Apply</a></li>';
    }
    output += '<li><a class="badge_action bdet" data-shortname="' + shortname + '" href="#">Detail</a></li>';


    output += '' +
              ' </ul>' +
              '</div>';

    return output;
  }

  function claimAction() {
    var code = $('#input-code').val();
    var modal = $('#claim-modal');
    var error = $('#claim-error');
    error.html('&nbsp');
    $.ajax({
      url: '/claim/' + encodeURIComponent(code),
      success: function(data) {
        modal.html(data);
        modal.find('a').click(submitClaim);
        modal.foundation('reveal', 'open');
      },
      error: function() {
        error.html("We don't recognize that claim code. Please try again.");
      }
    });
  }

  function showPushModal(shortname, email) {
    var modal = $('#claim-modal');

    $.ajax({
      url: '/pushbadge?shortname=' + encodeURIComponent(shortname) + '&email=' + encodeURIComponent(email),
      success: function(data) {
        modal.html(data);
        modal.find('a.babp').click(function() {
          var url = $(this).attr('data-assertion-url');
          OpenBadges.issue([url], function(errors, successes) { modal.foundation('reveal', 'close') } );
          return false;
        });
        modal.find('a.closebutton').click(function() {
          modal.foundation('reveal', 'close');
          return false;
        });
        modal.foundation('reveal', 'open');
      }
    });
  }


  //a function to process BadgeUI clicks (details,delete,etc.)
  function badgeAction(element) {
    makeModal(element);
  }

  //a function to create an alert box element and add to the DOM
  function makeAlert(text,status) {
    if($('.alert-box').length != 0) {
      $('.alert-box').remove();
    }
    var alert = '<div data-alert class="alert-box ' + status + '"><span class="content">' + text + '</span><a href="#" class="close">&times;</a></div>';
    $(alert).prependTo($('body')).fadeIn('fast');
  }

  //a function to get badge details and display them in a modal
  //display modal to the left,right,or over the list itself depending on circumstances
  function makeModal(element, showDetail) {
    var shortname = element.data('shortname'),
    elemPosition = element.parent().offset().left,
    bodyWidth = $('body').width(),
    parentUL;

    if(element.parents('.grid').length) {
      parentUL = element.parents('.grid');
    } else {
      parentUL = $('.grid').first();
    }

    var firstli = parentUL.find('li:first-child').find('a');
    var firstli_offset = firstli.offset(),
    xpos = firstli_offset.left,
    ypos = firstli_offset.top,
    firstli_w = firstli.width(),
    firstli_h = firstli.height(),
    numRows = calculateLIsInRow(parentUL.children('li')),
    height = firstli_h,
    width = firstli_w;

    if(numRows != 3 && numRows != 1) {
      width = ((firstli_w * 2) + 20);
      height = ((firstli_h * 2) + 20);
      //display on the right if element is on the left
    if(numRows == 1) { height*=2; width=firstli_w; }
    if(elemPosition < (bodyWidth / 2) && (numRows == 4)) xpos = (xpos + width + 20);
    } else if(numRows == 3){
      width = ((firstli_w * 1.5) + 20);
      height = ((firstli_h * 4) + 30);
       //display on the right if element is on the left
      if(elemPosition < (bodyWidth / 2)) xpos = (xpos + firstli_w + 20);
    } else {
      console.log("no idea how to display modal");
    }

    function finishModal(details) {
      var close = $('<a href="#" class="close">×</a>').click(function(){$('#badge_modal').remove();return false});
      var inner = $('<div style="top:' + ypos + 'px;left:' + xpos + 'px;width:' + width + 'px;" id="badge_modal_inner"></div>');
      var outer = $('<div id="badge_modal"></div>');

      outer.append(inner.append(details,close));

      if($('#badge_modal').length != 0) {
        $('#badge_modal').remove();
      }
      outer.appendTo('body').fadeIn('fast');

      $('#modal-form').on('submit', submitApplication);

      window.scrollTo(0,ypos);
    }

    if (element.is('.bdet') || showDetail) {
      return retrieveBadge(shortname, finishModal);
    }
    else if (element.is('.bgiv')) {
      return retrieveGive(shortname, finishModal);
    }
    else if (element.is('.bapp')) {
      return retrieveApply(shortname, finishModal);
    } else {
      console.log('FATAL MODAL ERROR');
    }
  }

  //a function to return the number of list items in a row (good for responsive lists)
  function calculateLIsInRow(element) {
    var lisInRow = 0;
    element.each(function() {
        if($(this).prev().length > 0) {
            if($(this).position().top != $(this).prev().position().top) return false;
            lisInRow++;
        }
        else {
            lisInRow++;   
        }
    });

    return lisInRow;
  }

  function submitClaim() {
    var claimModal = $('#claim-modal');
    var claimForm = claimModal.find('form');
    var feedback = claimForm.find('#claim-feedback');
    $.ajax({
      url: claimForm.attr('action'),
      type: 'POST',
      data: claimForm.serialize(),
      success: function(data) {
        showPushModal(data.badge.shortname, data.email);
      },
      error: function(xhr, status, error) {
        feedback.html(xhr.responseText);
        feedback.show();
      }
    });

    return false;
  }

  function submitApplication() {
    var form = $('#modal-form');
    var feedback = form.find('#modal-feedback');
    $.ajax({
      url: $(this).attr('action'),
      type: 'POST',
      data: $(this).serialize(),
      success: function(data, status, xhr) {
        form.find('input, textarea').attr('disabled', 'disabled');
        feedback.html(data);
        form.find('input.button').hide();
        feedback.show();
      },
      error: function(xhr, status, error) {
        feedback.html(xhr.responseText);
        feedback.show();
      }
    });

    return false;
  }


  function retrieveBadge(shortname, callback) {
    $.ajax({
      url: '/badge/' + encodeURIComponent(shortname),
      success: callback
    });
  }

  function retrieveApply(shortname, callback) {
    $.ajax({
      url: '/badge/' + encodeURIComponent(shortname) + '?mode=apply',
      success: callback
    });
  }

  function retrieveGive(shortname, callback) {
    $.ajax({
      url: '/badge/' + encodeURIComponent(shortname) + '?mode=give',
      success: callback
    });
  }

  function dateFromUnix(timestamp) {
    var date = new Date(timestamp * 1000);
    return date;
  }

  //a function to retrieve all a users collections containting a specified badge
  function getCollectionsByBadge(hash,style) {
    //fetch collection hash and names
    collection_hash1="collectionhash-a";
    collection_hash2="collectionhash-b";
    collection_hash3="collectionhash-c";

    var output = '' +
    '<li><a class="badge_action brfc ' + hash + ' ' + collection_hash1 + '" href="#">x</a><a class="redirect ' + collection_hash1 + '" href="' + docroot + '/badge/by-collection/collectionhash-x.html"><span class="title">Collection A</span></a></li>' +
    '<li><a class="badge_action brfc ' + hash + ' ' + collection_hash2 + '" href="#">x</a><a class="redirect ' + collection_hash2 + '" href="' + docroot + '/badge/by-collection/collectionhash-x.html"><span class="title">Collection B</span></a></li>' +
    '<li><a class="badge_action brfc ' + hash + ' ' + collection_hash3 + '" href="#">x</a><a class="redirect ' + collection_hash3 + '" href="' + docroot + '/badge/by-collection/collectionhash-x.html"><span class="title">Collection C</span></a></li>';

    return output;
  }
  //a function to retrieve all a users collections
  function getCollections(hash,style) {
    //fetch collection hash and names
    collection_hash1="collectionhash-d";
    collection_hash2="collectionhash-e";
    collection_hash3="collectionhash-f";

    var output = '' +
    '<li><a class="badge_action batc ' + hash + ' ' + collection_hash1 + '" href="#">Add to <span class="title">Collection D</title></a></li>' +
    '<li><a class="badge_action batc ' + hash + ' ' + collection_hash2 + '" href="#">Add to <span class="title">Collection E</title></a></li>' +
    '<li><a class="badge_action batc ' + hash + ' ' + collection_hash3 + '" href="#">Add to <span class="title">Collection F</title></a></li>';

    return output;
  }
});

function getHashParams() {

    var e,
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s); },
        q = window.location.hash.substring(1);

    while (e = r.exec(q))
       hashParams[d(e[1])] = d(e[2]);
    return hashParams;
}