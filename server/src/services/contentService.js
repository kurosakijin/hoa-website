const SiteContent = require('../models/SiteContent');
const { defaultLandingPageContent } = require('../data/landingPageContent');

const LANDING_PAGE_CONTENT_KEY = 'landing-page';

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toLandingPagePayload(document) {
  return {
    content: {
      ...defaultLandingPageContent,
      ...(document?.landingPage || {}),
    },
    updatedAt: document?.updatedAt ? document.updatedAt.toISOString() : null,
  };
}

async function ensureLandingPageContentDocument() {
  let contentDocument = await SiteContent.findOne({ key: LANDING_PAGE_CONTENT_KEY });

  if (!contentDocument) {
    contentDocument = await SiteContent.create({
      key: LANDING_PAGE_CONTENT_KEY,
      landingPage: defaultLandingPageContent,
    });
  }

  return contentDocument;
}

async function getLandingPageContent() {
  const contentDocument = await ensureLandingPageContentDocument();
  return toLandingPagePayload(contentDocument);
}

async function updateLandingPageContent(payload) {
  const nextLandingPageContent = Object.fromEntries(
    Object.entries(defaultLandingPageContent).map(([fieldName, fallbackValue]) => {
      const nextValue = trimValue(payload?.[fieldName]);
      return [fieldName, nextValue || fallbackValue];
    })
  );

  const contentDocument = await SiteContent.findOneAndUpdate(
    { key: LANDING_PAGE_CONTENT_KEY },
    {
      $set: {
        landingPage: nextLandingPageContent,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return toLandingPagePayload(contentDocument);
}

module.exports = {
  getLandingPageContent,
  updateLandingPageContent,
};
