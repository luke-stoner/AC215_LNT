$(document).ready(function(){
    function updateIndicators(currentSlideIndex) {
        var targetElement = $(".testimonial .tabs li");
        targetElement.eq(currentSlideIndex).addClass('active');
        targetElement.not(targetElement[currentSlideIndex]).removeClass('active');
    }

    // Initialize carousel with a very long interval
    $('#carouselExampleIndicators').carousel({
        interval: 999999999
    });

    // Handle clicking on indicators
    $(".testimonial .indicators li").click(function(){
        var i = $(this).index();
        updateIndicators(i);
    });

    // Handle clicking on image tabs
    $(".testimonial .tabs li").click(function(){
        var i = $(this).index();
        $('#carouselExampleIndicators').carousel(i);
        updateIndicators(i);
    });

    // Handle clicking on "Next Slide" button
    $('.next-slide').click(function() {
        var $carousel = $('#carouselExampleIndicators');
        var totalItems = $carousel.find('.carousel-item').length;
        var currentIndex = $carousel.find('.carousel-item.active').index() + 1;

        // Determine the index for the next slide
        var nextIndex = (currentIndex < totalItems) ? currentIndex : 0;

        // Move carousel to the next slide
        $carousel.carousel('next');

        // Update indicators immediately
        updateIndicators(nextIndex);
    });

    // Optional: Update swiper-pagination span if needed
    $(".slider .swiper-pagination span").each(function(i){
        $(this).text(i+1).prepend("0");
    });
});
