// Set default ease
TweenMax.defaultEase = Linear.easeOut;

// Hide the news bar to start
const newsBar = document.getElementById("breaking-news");
newsBar.style.visibility = "hidden";

const video = document.getElementById("myVideo");
const acceptButton = document.getElementById("accept-button");

document.addEventListener("DOMContentLoaded", function () {
  var fullPageInstance = new fullpage("#fullpage", {
    navigation: true,
    navigationPosition: "right",
    licenseKey: "gplv3-license",
    autoScrolling: true,

    onLeave: (origin, destination, direction) => {
      // Show/Hide breaking news bar
      if (destination.index === 0) {
        newsBar.style.visibility = "hidden";
      } else if (destination.index === 1 && !video.ended) {
        newsBar.style.visibility = "hidden";
      } else {
        newsBar.style.visibility = "visible";
      }

      if (destination.index == 4) {
        const candidateIntro = new CandidateIntroduction(
          candidate_descriptions
        );
      }

      if (destination.index == 5) {
        const volumeBubbles = new BubbleChart();
      }

      if (destination.index == 6) {
        const sentimentChart = new SentimentChart();
      }

      if (destination.index == 9) {
        const byNetwork = new ByNetworkVisual();
      }
    },
  });

  // Start with navbar hidden
  const navBar = document.getElementById("fp-nav");
  navBar.style.visibility = "hidden";

  // UNCOMMENT WHEN WE ARE OUT OF DEVELOPMENT
  // Disable scrolling initially
  // fullPageInstance.setAllowScrolling(false);
  // fullPageInstance.setKeyboardScrolling(false);

  // Event listeners to guide user through video playing process
  acceptButton.addEventListener("click", userAccepted);
  video.addEventListener("ended", videoEnded, false);

  function userAccepted() {
    fullPageInstance.moveSectionDown();
  }

  function videoEnded() {
    this.removeAttribute("controls");
    this.removeAttribute("data-autoplay");
    this.classList.add("video-fade-out");

    fullPageInstance.setAllowScrolling(true);
    fullPageInstance.setKeyboardScrolling(true);
    navBar.style.visibility = "visible";
    newsBar.style.visibility = "visible";
  }

  function handleModalVisibility() {
    const modalElement = document.getElementById("candidate-modal");
    if (modalElement) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Modal is visible
            fullPageInstance.setAllowScrolling(false);
            fullPageInstance.setKeyboardScrolling(false);
          } else {
            // Modal is hidden
            fullPageInstance.setAllowScrolling(true);
            fullPageInstance.setKeyboardScrolling(true);
          }
        });
      });

      // Start observing the modal element
      observer.observe(modalElement);
    }
  }

  // Call the function to start observing the modal visibility
  handleModalVisibility();
});

