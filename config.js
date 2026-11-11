/**
 * Frontend Configuration for 2026 Christmas with the Sosa's
 * Loaded by /invite/index.html and /invite/app.js.
 */
window.PARTY_CONFIG = {
  // Deployed Google Apps Script Web App URL (Clasp deployment @1)
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxVejPfTKv7Pm85dtmMoadlyYFDBdWlIpN88QssbYUPph_SoJ-TtZKciuTyQ9yS908blQ/exec',

  // When GAS_WEB_APP_URL starts with "REPLACE_", app.js automatically uses localStorage mock mode
  // so local testing and UI development work with zero backend setup.
  EVENT: {
    title: "2026 Christmas with the Sosa's",
    subtitle:
      "We celebrate Christmas so that's our anchor holiday, but if you're invited, you're welcome no matter how you ring in the season.",
    dateDisplay: 'Saturday, December 5, 2026 @ 5:00 PM',
    startIsoUtc: '20261205T220000Z',
    endIsoUtc: '20261206T030000Z',
    address: '8700 Green Apple Court, Wake Forest, NC',
    mapsUrl: 'https://maps.google.com/?q=8700+Green+Apple+Court,+Wake+Forest,+NC',
    whiteElephantAnnouncement:
      "We'll be doing our White Elephant gift exchange again this year just like last year! Please let us know in your RSVP if you'll be participating. The average gift value should be no more than $40.",
    whiteElephantRulesUrl: 'https://www.whiteelephantrules.com/',
    whiteElephantVideoUrl: 'https://youtube.com/shorts/f4T9XBq3QkI',
    whiteElephantLimit: '$40',
    hostsNote:
      "We will have Bogle Merlot and a Chardonnay on hand, plus plenty of food and dessert for everyone! You don't need to bring a thing—as always, we'll have enough food for all. However, we encourage you to bring your favorite wine, punch, or beer (or a dish, appetizer, or dessert if you wish), and please let us know below so we can plan accordingly and minimize food waste."
  },

  BRINGING_OPTIONS: [
    'Favorite Wine, Punch, or Beer (We will have Bogle Merlot & Chardonnay!)',
    "Appetizer / Hors d'oeuvres",
    'Dish (Side or Main)',
    'Dessert / Sweet Treat',
    'Nothing — just bringing ourselves! (Plenty of food provided)'
  ],

  WHITE_ELEPHANT_OPTIONS: [
    'Yes - Holiday fun is my middle name! 🎉',
    "No - I'll miss out on the fun 😭"
  ],

  FAQS: [
    {
      question: 'Should I bring something?',
      answer:
        "If you know Jonnin then you know she loves to cook and bake! As always, we'll have plenty of food and dessert for all to enjoy, plus Bogle Merlot and a Chardonnay. People don't need to bring anything at all. That said, we encourage you to bring your favorite wine, punch, or beer—or if you wish to bring a dish, charcuterie, appetizer, or dessert/treat, please let us know in your RSVP so we can plan accordingly and minimize food waste. Of course, if you have allergies, feel free to bring something you can enjoy safely."
    },
    {
      question: 'Can I bring my children?',
      answer:
        'Your children are welcome! All we ask is that you keep a watchful eye on them if they are mobile. Like last year, Jonnin is hoping to have a game for the kids to play, and we have ample Wi-Fi for those who want to stay occupied on their devices.'
    },
    {
      question: "What's a White Elephant? (Gift Exchange Details)",
      answer:
        "We are doing the White Elephant gift exchange again this year just like last year! White Elephant is a gift-swapping game where each participating person brings a wrapped gift (couples can share, though it's best to have one each), and players take turns either choosing a new wrapped gift or stealing one that has already been opened (max 2 steals per gift for us). Please keep the average gift value to no more than $40. Gag gifts and unopened regifts are welcome!",
      linkText: 'Read Official White Elephant Rules & How to Play',
      linkUrl: 'https://www.whiteelephantrules.com/',
      secondaryLinkText: 'Watch quick overview video',
      secondaryLinkUrl: 'https://youtube.com/shorts/f4T9XBq3QkI'
    }
  ],

  MOCK_CONTRIBUTIONS: [
    {
      guestName: 'Vinny & Jonnin Sosa (Hosts)',
      category: 'Hosted Drinks & Food',
      itemDescription: 'Bogle Merlot, Chardonnay & Full Holiday Spread'
    }
  ]
};
