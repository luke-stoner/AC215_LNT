class Candidate {
  constructor(
    first,
    last,
    party,
    party_short,
    image,
    state,
    birthday,
    alternate_image,
    modal_bio
  ) {
    this.first = first;
    this.last = last;
    this.party = party;
    this.party_short = party_short;
    this.image = image;
    this.state = state;
    this.birthday = birthday;
    this.alternate_image = alternate_image;
    this.modal_bio = modal_bio;
  }

  calculateAge() {
    const birthdayDate = new Date(this.birthday);
    const today = new Date();

    let age = today.getFullYear() - birthdayDate.getFullYear();
    const monthDifference = today.getMonth() - birthdayDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthdayDate.getDate())
    ) {
      age--;
    }

    return age;
  }
  calculateMentions() {
    return new Promise((resolve, reject) => {
      d3.csv("data/labeled.csv")
        .then((data) => {
          const mentions = data.filter(
            (record) => record.last_name === this.last
          );
          const mentionCount = mentions.length;

          resolve(mentionCount);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  calculatePositivePercent() {
    return new Promise((resolve, reject) => {
      d3.csv("data/labeled.csv")
        .then((data) => {
          const mentions = data.filter(
            (record) => record.last_name === this.last
          );
          const totalMentions = mentions.length;
          const positiveMentions = mentions.filter(
            (record) => record.label === "1"
          ).length;

          if (totalMentions === 0) {
            resolve(0);
          } else {
            const positivePercent = (positiveMentions / totalMentions) * 100;
            resolve(positivePercent);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}

const candidate_descriptions = [
  {
    first: "Joe",
    last: "Biden",
    party: "Democrat",
    party_short: "D",
    image: "img/candidate_portraits/biden.png",
    state: "Delaware",
    birthday: "November 20, 1942",
    alternate_image:
      "https://dynaimage.cdn.cnn.com/cnn/c_fill,g_auto,w_1200,h_675,ar_16:9/https%3A%2F%2Fcdn.cnn.com%2Fcnnnext%2Fdam%2Fassets%2F190520113023-joe-biden-philadelphia-05182019.jpg",
    modal_bio:
      "Born on November 20, 1942, Joe Biden is the 46th President of the United States, a Democrat, and a seasoned politician. He served as the 47th Vice President from 2009 to 2017 and represented Delaware in the U.S. Senate from 1973 to 2009.",
  },
  {
    first: "Doug",
    last: "Burgum",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/burgum.png",
    state: "North Dakota",
    birthday: "August 1, 1956",
    alternate_image:
      "https://media.npr.org/assets/img/2023/06/07/ap23158602259345_wide-2269bafb193844302f7aaaf56eed058319a1c011-s1400-c100.jpg",
    modal_bio:
      "Doug Burgum, born on August 1, 1956, is an American entrepreneur and politician currently holding the position of the 33rd Governor of North Dakota since 2016. He stands out as one of the most affluent governors in the United States, boasting an estimated net worth of $1.1 billion.",
  },
  {
    first: "Chris",
    last: "Christie",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/christie.png",
    state: "New Jersey",
    birthday: "September 6, 1962",
    alternate_image:
      "https://s.abcnews.com/images/Politics/ap_christie_kb_150630_16x9_992.jpg",
    modal_bio:
      "Chris Christie, born on September 6, 1962, is an American politician and former federal prosecutor who held the office of the 55th governor of New Jersey from 2010 to 2018. As a prominent member of the Republican Party, he previously served as the United States Attorney for New Jersey from 2002 to 2008.",
  },
  {
    first: "Ron",
    last: "DeSantis",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/desantis.png",
    state: "Florida",
    birthday: "September 14, 1978",
    alternate_image:
      "https://image.cnbcfm.com/api/v1/image/107250491-1685744108263-gettyimages-1258386230-desantisgilbertsc-1-10.jpeg?v=1689190175&w=929&h=523&vtcrop=y",
    modal_bio:
      "Ron DeSantis, born September 14, 1978, is an American politician serving since 2019 as the 46th governor of Florida. A member of the Republican Party, he represented Florida's 6th congressional district in the U.S. House of Representatives from 2013 to 2018.",
  },
  {
    first: "Larry",
    last: "Elder",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/elder.png",
    state: "California",
    birthday: "April 27, 1952",
    alternate_image:
      "https://static01.nyt.com/images/2023/10/26/multimedia/26pol-elder-vjqc/26pol-elder-vjqc-videoSixteenByNine3000.jpg",
    modal_bio:
      "Larry Elder, born on April 27, 1952, is an American conservative political commentator and a prominent talk radio host. He is best known for hosting The Larry Elder Show, which is based in California. The show originally started as a local program on Los Angeles radio station KABC in 1993. It has gained national recognition as it was nationally syndicated.",
  },
  {
    first: "Asa",
    last: "Hutchinson",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/hutchinson.png",
    state: "Arkansas",
    birthday: "December 3, 1950",
    alternate_image:
      "https://i.abcnewsfe.com/a/80621974-a42e-472d-9d50-767adc28883f/asa-hutchinson-annoucement-02-ap-jef-230426_1682530978181_hpMain_16x9.jpg?w=992",
    modal_bio:
      "Asa Hutchinson, born December 3, 1950, is an American attorney, businessman, and politician who served as the 46th governor of Arkansas from 2015 to 2023. A member of the Republican Party, he previously served as a U.S. attorney, U.S. representative, and in two roles in the George W. Bush administration.",
  },
  {
    first: "Nikki",
    last: "Haley",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/haley.png",
    state: "South Carolina",
    birthday: "January 20, 1972",
    alternate_image:
      "https://static01.nyt.com/images/2023/02/15/multimedia/15pol-haley-trump-vlbk/15pol-haley-trump-vlbk-videoSixteenByNine3000.jpg",
    modal_bio:
      "Nikki Haley, born January 20, 1972, is an American politician and diplomat who served as Governor of South Carolina from 2011 to 2017, and as the 29th United States ambassador to the United Nations from January 2017 through December 2018. A member of the Republican Party, Haley is the first Indian American to serve in a presidential cabinet",
  },
  {
    first: "Will",
    last: "Hurd",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/hurd.png",
    state: "Texas",
    birthday: "August 19, 1977",
    alternate_image:
      "https://static01.nyt.com/images/2023/06/07/multimedia/00pol-hurd-hfo-tvmk/00pol-hurd-hfo-tvmk-videoSixteenByNine3000.jpg",
    modal_bio:
      "Will Hurd, born August 19, 1977, is a former CIA officer turned American politician. He served as the U.S. representative for Texas's 23rd congressional district from 2015 to 2021. Hurd was known for his expertise in technology, cybersecurity, and bipartisan collaboration during his congressional tenure.",
  },
  {
    first: "Perry",
    last: "Johnson",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/johnson.png",
    state: "Michigan",
    birthday: "January 23, 1948",
    alternate_image:
      "https://media.cnn.com/api/v1/images/stellar/prod/231020171419-perry-johnson-file-091623.jpg?c=16x9&q=h_720,w_1280,c_fill",
    modal_bio:
      "Perry Johnson, born on January 23, 1948, is an American entrepreneur, accomplished author, and a notable political figure hailing from Michigan. Johnson is recognized for his publications on international quality control standards and certification, having authored several books on the subject.",
  },
  {
    first: "Robert",
    last: "Kennedy",
    party: "Independent",
    party_short: "I",
    image: "img/candidate_portraits/kennedy.png",
    state: "Washington, D.C",
    birthday: "January 17, 1954",
    alternate_image:
      "https://media-cldnry.s-nbcnews.com/image/upload/rockcms/2023-05/230405-robert-f-kennedy-jr-se-500p-72a6a6.jpg",
    modal_bio:
      "Robert Kennedy Jr., born January 17, 1954, is an American politician, environmental lawyer, and activist. A member of the Kennedy family, he is the son of U.S. Attorney General and Senator Robert F. Kennedy and the nephew of U.S. President John F. Kennedy and Senator Ted Kennedy.",
  },
  {
    first: "Mike",
    last: "Pence",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/pence.png",
    state: "Indiana",
    birthday: "June 7, 1959",
    alternate_image:
      "https://media-cldnry.s-nbcnews.com/image/upload/rockcms/2023-10/231014-mike-pence-mjf-1707-bb6d2a.jpg",
    modal_bio:
      "Mike Pence, born June 7, 1959, is a Republican politician who served as the 48th Vice President of the United States from 2017 to 2021. Before that, he was Indiana's 50th Governor from 2013 to 2017 and a U.S. House Representative from 2001 to 2013. Despite controversy around the 2020 election, he distanced himself from Trump, criticizing his post-election conduct.",
  },
  {
    first: "Vivek",
    last: "Ramaswamy",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/ramaswamy.png",
    state: "Ohio",
    birthday: "August 9, 1985",
    alternate_image:
      "https://media.vanityfair.com/photos/64d64685f787e518faf0090c/16:9/w_2000,h_1125,c_limit/Vivek%20Ramaswamy.jpg",
    modal_bio:
      "Vivek Ramaswamy, born August 9, 1985, is an American entrepreneur and presidential candidate. He founded Roivant Sciences, a pharmaceutical company, in 2014. He holds a bachelor's degree in biology from Harvard College and a J.D. from Yale Law School. Ramaswamy previously worked as an investment partner at a hedge fund and co-founded Strive Asset Management, an investment firm.",
  },
  {
    first: "Tim",
    last: "Scott",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/scott.png",
    state: "South Carolina",
    birthday: " September 19, 1965",
    alternate_image:
      "https://media.npr.org/assets/img/2023/05/22/ap23142570032377_wide-8ecec39ca8919f0352c0c36ad4b28ea01a4e37b3.jpg",
    modal_bio:
      "Tim Scott, born September 19, 1965, is an American politician and businessman, serving as the junior United States Senator from South Carolina since 2013. Prior roles include service in the South Carolina House of Representatives, the U.S. House of Representatives, and as a Charleston city councilor.",
  },
  {
    first: "Donald",
    last: "Trump",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/trump.png",
    state: "Florida",
    birthday: "June 14, 1946",
    alternate_image:
      "https://s7d2.scene7.com/is/image/TWCNews/ap223108119476261_11072022",
    modal_bio:
      "Donald Trump, born June 14, 1946, served as the 45th President of the United States. He is a businessman, media personality, and politician who won the presidency as the Republican nominee in 2016. His presidency was marked by a distinctive style, sometimes described as divisive. His administration faced scrutiny for Trump's refusal to concede the 2020 election.",
  },
  {
    first: "Marianne",
    last: "Williamson",
    party: "Democrat",
    party_short: "D",
    image: "img/candidate_portraits/williamson.png",
    state: "Iowa",
    birthday: "July 8, 1952",
    alternate_image:
      "https://static.politico.com/7c/c0/a6a93bad4c008f4a8c11cdd0e55f/election-2024-williamson-44761.jpg",
    modal_bio:
      "Marianne Deborah Williamson, born July 8, 1952, is an American author, speaker, and presidential candidate. She gained fame as a spiritual leader and bestselling author. She's known for her charitable work, and serving on the board of RESULTS, a nonprofit focused on poverty solutions.",
  },
];
