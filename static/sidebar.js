$(document).ready(function () {

    $("#sidebar").mCustomScrollbar({
        theme: "minimal"
    });


    $('.overlay').on('click', function () {
        // hide sidebar
        $('#sidebar').removeClass('active');
        // hide overlay
        $('.overlay').removeClass('active');
        // hide info
        $('#infobar').removeClass('active');
    });

    $('#sidebarCollapse').on('click', function () {
        // open sidebar
        $('#sidebar').addClass('active');
        // fade in the overlay
        $('.overlay').addClass('active');
        $('.collapse.in').toggleClass('in');
    });

    $('#infobarCollapse').on('click', function () {
        // open infobar
        $('#infobar').addClass('active');
        // fade in the overlay
        $('.overlay').addClass('active');
        $('.collapse.in').toggleClass('in');
    });
});