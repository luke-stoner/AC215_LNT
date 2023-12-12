// Set default ease
TweenMax.defaultEase = Linear.easeOut;

// Hide the news bar to start
const newsBar = document.getElementById("breaking-news");
newsBar.style.visibility = "hidden";

const video = document.getElementById("myVideo");
const acceptButton = document.getElementById("accept-button");

const candidateColorMap = {};
["biden", "christie", "desantis", "haley", "kennedy", "pence", "ramaswamy", "scott", "trump", "williamson"]
    .forEach((candidate, index) => {
  if (candidate.toLowerCase() === "scott") {
    candidateColorMap[candidate.toLowerCase()] = "#72bcd4"; // Assigning light blue to scott
  } else {
    candidateColorMap[candidate.toLowerCase()] = d3.schemeCategory10[index];
  }
});

document.addEventListener("DOMContentLoaded", function () {
  var visitedCoverageByNetwork = false;

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

      const tl = new TimelineMax({ delay: 0.1 });

      if (destination.index === 2) {
        const paragraphs = document.querySelectorAll(
          "#white-house-introduction p"
        );
        const fadeInDelay = 2000;

        function fadeInParagraphs(index) {
          if (index < paragraphs.length) {
            paragraphs[index].style.opacity = "1";
            setTimeout(() => {
              fadeInParagraphs(index + 1);
            }, fadeInDelay);
          }
        }

        fadeInParagraphs(0);
      }

      if (destination.index === 4) {
        const whiteHouse = document.getElementById("white-house");
        tl.fromTo(
          whiteHouse,
          0.7,
          { x: "100%", opacity: 0, scale: 0.5 },
          { x: "-30%", opacity: 1, scale: 1, ease: Power2.easeOut }
        );

        tl.to(whiteHouse, 1.5, {
          scale: 0.95,
          yoyo: true,
          repeat: -1,
          ease: Power2.easeInOut,
        });
      }

      if (destination.index == 7) {
        const candidateIntro = new CandidateIntroduction(
          candidate_descriptions
        );
      }

      if (destination.index == 8) {
        const volumeBubbles = new BubbleChart();
      }

      if (destination.index == 9) {
        const sentimentChart = new SentimentChart();
      }

      if (destination.index == 12) {
        const byNetwork = new ByNetworkVisual();
      }

      // Show the Bootstrap modal when destination index is 11
      if (destination.index == 13) {
        if (!visitedCoverageByNetwork) {
          setTimeout(function () {
            $("#network-modal").modal("show");
          }, 500);
        }
        visitedCoverageByNetwork = true;
      }

      if (destination.index === 14) {
        const breakingNews = document.getElementById("breaking-news-image");
        tl.fromTo(
            breakingNews,
            0.7,
            { x: "100%", opacity: 0, scale: 0.5 },
            { x: "-30%", opacity: 1, scale: 1, ease: Power2.easeOut }
        );

        tl.to(breakingNews, 1.5, {
          scale: 0.95,
          yoyo: true,
          repeat: -1,
          ease: Power2.easeInOut,
        });
      }

      if (destination.index === 16) {
        const ballotBox = document.getElementById("ballot-box");
        tl.fromTo(
          ballotBox,
          0.7,
          { x: "100%", opacity: 0, scale: 0.5 },
          { x: "-30%", opacity: 1, scale: 1, ease: Power2.easeOut }
        );

        tl.to(ballotBox, 1.5, {
          scale: 0.95,
          yoyo: true,
          repeat: -1,
          ease: Power2.easeInOut,
        });
      }
    },
  });

  const navBar = document.getElementById("fp-nav");

  // Event listeners to guide user through video playing process
  acceptButton.addEventListener("click", userAccepted);
  video.addEventListener("ended", videoEnded, false);

  // Disable scrolling initially & hide nav bar
  disableScrolling();
  hideNavBar();

  function userAccepted() {
    fullPageInstance.moveSectionDown();
    enableScrolling();
    handleModalVisibility();
    playProjectExplanationVideo();
    showNavBar();
  }

  function hideNavBar() {
    navBar.style.visibility = "hidden";
  }
  function showNavBar() {
    navBar.style.visibility = "visible";
  }

  function disableScrolling() {
    fullPageInstance.setAllowScrolling(false);
    fullPageInstance.setKeyboardScrolling(false);
  }

  function enableScrolling() {
    fullPageInstance.setAllowScrolling(true);
    fullPageInstance.setKeyboardScrolling(true);
  }

  function videoEnded() {
    this.removeAttribute("controls");
    this.removeAttribute("data-autoplay");
    this.classList.add("video-fade-out");
    newsBar.style.visibility = "visible";
  }

  function handleModalVisibility() {
    const modalElements = document.querySelectorAll(".modal");
    if (modalElements.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Modal is visible
            disableScrolling();
          } else {
            // Modal is hidden
            enableScrolling();
          }
        });
      });

      modalElements.forEach((modalElement) => {
        observer.observe(modalElement);
      });
    }
  }

  function playProjectExplanationVideo() {
    var modal = document.querySelector("#introModal");
    var video = modal.querySelector("video");

    modal.addEventListener("hidden.bs.modal", function (e) {
      video.pause();
    });
  }
});
