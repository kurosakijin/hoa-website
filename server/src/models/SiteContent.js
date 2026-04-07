const mongoose = require('mongoose');
const { defaultLandingPageContent } = require('../data/landingPageContent');

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    landingPage: {
      brandShortName: { type: String, default: defaultLandingPageContent.brandShortName, trim: true },
      brandFullName: { type: String, default: defaultLandingPageContent.brandFullName, trim: true },
      navHomeLabel: { type: String, default: defaultLandingPageContent.navHomeLabel, trim: true },
      navCommunityLabel: { type: String, default: defaultLandingPageContent.navCommunityLabel, trim: true },
      navAboutLabel: { type: String, default: defaultLandingPageContent.navAboutLabel, trim: true },
      heroEyebrow: { type: String, default: defaultLandingPageContent.heroEyebrow, trim: true },
      heroTitle: { type: String, default: defaultLandingPageContent.heroTitle, trim: true },
      heroDescription: { type: String, default: defaultLandingPageContent.heroDescription, trim: true },
      primaryCtaLabel: { type: String, default: defaultLandingPageContent.primaryCtaLabel, trim: true },
      secondaryCtaLabel: { type: String, default: defaultLandingPageContent.secondaryCtaLabel, trim: true },
      communityEyebrow: { type: String, default: defaultLandingPageContent.communityEyebrow, trim: true },
      communityTitle: { type: String, default: defaultLandingPageContent.communityTitle, trim: true },
      communityDescription: { type: String, default: defaultLandingPageContent.communityDescription, trim: true },
      aboutEyebrow: { type: String, default: defaultLandingPageContent.aboutEyebrow, trim: true },
      aboutTitle: { type: String, default: defaultLandingPageContent.aboutTitle, trim: true },
      aboutParagraphOne: { type: String, default: defaultLandingPageContent.aboutParagraphOne, trim: true },
      aboutParagraphTwo: { type: String, default: defaultLandingPageContent.aboutParagraphTwo, trim: true },
      detailsEyebrow: { type: String, default: defaultLandingPageContent.detailsEyebrow, trim: true },
      detailsTitle: { type: String, default: defaultLandingPageContent.detailsTitle, trim: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteContent', siteContentSchema);
