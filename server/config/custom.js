/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

const { URL } = require('url');
const sails = require('sails');
const z = require('zod');

const defaultTheme = require('./default-theme.json');

const parsedBasedUrl = new URL(process.env.BASE_URL || 'http://localhost:3000');

const ThemeLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const LocaleThemeHeaderSchema = z.object({
  logo: z
    .object({
      src: z.string().min(1),
      width: z.string().min(1).optional(),
      height: z.string().min(1).optional(),
      alt: z.string(),
    })
    .optional(),
});

const HeaderThemeSchema = z.object({
  default: LocaleThemeHeaderSchema,
  fr: LocaleThemeHeaderSchema.optional(),
  en: LocaleThemeHeaderSchema.optional(),
});

const LocaleThemeFooterSchema = z.object({
  externalLinks: z.array(ThemeLinkSchema).optional(),
  legalLinks: z.array(ThemeLinkSchema).optional(),
  license: z
    .object({
      label: z.string().min(1),
      link: ThemeLinkSchema,
    })
    .optional(),
  logo: z
    .object({
      src: z.string().min(1),
      width: z.string().min(1).optional(),
      height: z.string().min(1).optional(),
      alt: z.string(),
    })
    .optional(),
});

const LocaleThemeFeedbackSchema = z.object({
  items: z
    .array(
      z.object({
        type: z.enum(['chat', 'survey', 'video']),
        title: z.string().min(1),
        description: z.string().min(1).optional(),
        href: z.string().min(1),
      }),
    )
    .optional(),
});

const FaviconThemeSchema = z.object({
  src: z.string().min(1),
  darkSrc: z.string().min(1).optional(),
});

const ThemeSchema = z.object({
  favicon: FaviconThemeSchema.optional(),
  disableDarkMode: z.boolean().optional(),
  // Overrides Cunningham CSS custom properties (e.g. "--c--globals--colors--brand-500"),
  // see client/src/assets/styles/cunningham-tokens.css for the full list of names.
  colors: z.record(z.string(), z.string()).optional(),
  // Overrides the base/accent font family, independently of THEME_PREFIX.
  fontFamily: z.string().min(1).optional(),
  header: HeaderThemeSchema.optional(),
  footer: z
    .object({
      default: LocaleThemeFooterSchema,
      fr: LocaleThemeFooterSchema.optional(),
      en: LocaleThemeFooterSchema.optional(),
    })
    .optional(),
  feedback: z
    .object({
      default: LocaleThemeFeedbackSchema,
      fr: LocaleThemeFeedbackSchema.optional(),
      en: LocaleThemeFeedbackSchema.optional(),
    })
    .optional(),
  gaufre: z
    .object({
      variant: z.enum(['dinum', 'anct']),
      apiUrl: z.string().min(1),
      widgetPath: z.string().min(1),
    })
    .optional(),
  feedbackWidget: z
    .object({
      apiUrl: z.string().min(1),
      widgetPath: z.string().min(1),
      channel: z.string().min(1),
    })
    .optional(),
});

const TemplateBoardsSchema = z.array(
  z.unknown(), // TODO: implement once really used in this version (duplicate functions...)
);

module.exports.custom = {
  /**
   *
   * Any other custom config this Sails app should use during development.
   *
   */

  baseUrl: process.env.BASE_URL,
  baseUrlPath: parsedBasedUrl.pathname,
  baseUrlSecure: parsedBasedUrl.protocol === 'https:',

  serviceName: process.env.SERVICE_NAME || 'Projets',

  tokenExpiresIn: parseInt(process.env.TOKEN_EXPIRES_IN, 10) || 365,

  // Location to receive uploaded files in. Default (non-string value) is a Sails-specific location.
  uploadsTempPath: null,
  uploadsBasePath: sails.config.appPath,

  userAvatarsPathSegment: 'public/user-avatars',
  projectBackgroundImagesPathSegment: 'public/project-background-images',
  attachmentsPathSegment:
    sails.config.environment === 'production' ? '/attachments' : 'private/attachments',

  defaultAdminEmail:
    process.env.DEFAULT_ADMIN_EMAIL && process.env.DEFAULT_ADMIN_EMAIL.toLowerCase(),

  statsApiToken: process.env.STATS_API_TOKEN || null,

  showDetailedAuthErrors: process.env.SHOW_DETAILED_AUTH_ERRORS === 'true',
  allowAllToCreateProjects: process.env.ALLOW_ALL_TO_CREATE_PROJECTS === 'true',

  // When set, enables org mode: users are auto-assigned as manager of the project matching
  // the value of this OIDC claim (e.g. 'siret'). When not set, free mode is used: users
  // can create and manage their own projects.
  organizationIdClaim: process.env.ORGANIZATION_ID_CLAIM || null,

  s3Endpoint: process.env.S3_ENDPOINT,
  s3Region: process.env.S3_REGION,
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  s3Bucket: process.env.S3_BUCKET,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',

  oidcIssuer: process.env.OIDC_ISSUER,
  oidcClientId: process.env.OIDC_CLIENT_ID,
  oidcClientSecret: process.env.OIDC_CLIENT_SECRET,
  oidcIdTokenSignedResponseAlg: process.env.OIDC_ID_TOKEN_SIGNED_RESPONSE_ALG,
  oidcUserinfoSignedResponseAlg: process.env.OIDC_USERINFO_SIGNED_RESPONSE_ALG,
  oidcScopes: process.env.OIDC_SCOPES || 'openid email profile',
  oidcResponseMode: process.env.OIDC_RESPONSE_MODE || 'fragment',
  oidcUseDefaultResponseMode: process.env.OIDC_USE_DEFAULT_RESPONSE_MODE === 'true',
  oidcAdminRoles: process.env.OIDC_ADMIN_ROLES ? process.env.OIDC_ADMIN_ROLES.split(',') : [],
  oidcClaimsSource: process.env.OIDC_CLAIMS_SOURCE || 'userinfo',
  oidcEmailAttribute: process.env.OIDC_EMAIL_ATTRIBUTE || 'email',
  oidcFullnameAttributes: process.env.OIDC_FULLNAME_ATTRIBUTES
    ? process.env.OIDC_FULLNAME_ATTRIBUTES.split(',').map((attr) => attr.trim())
    : ['given_name', 'usual_name'],
  oidcUsernameAttribute: process.env.OIDC_USERNAME_ATTRIBUTE || 'preferred_username',
  oidcRolesAttribute: process.env.OIDC_ROLES_ATTRIBUTE || 'groups',
  oidcIgnoreUsername: process.env.OIDC_IGNORE_USERNAME === 'true',
  oidcIgnoreRoles: process.env.OIDC_IGNORE_ROLES === 'true',
  oidcEnforced: process.env.OIDC_ENFORCED === 'true',
  oidcPostLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI || process.env.BASE_URL,

  // TODO: move client base url to environment variable?
  oidcRedirectUri: `${
    sails.config.environment === 'production' ? process.env.BASE_URL : 'http://localhost:3000'
  }/oidc-callback`,

  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT || 587,
  smtpName: process.env.SMTP_NAME,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM,
  smtpTlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',

  webhooks: JSON.parse(process.env.WEBHOOKS || '[]'), // TODO: validate structure

  templateBoards: TemplateBoardsSchema.parse(
    process.env.TEMPLATE_BOARDS ? JSON.parse(process.env.TEMPLATE_BOARDS) : [],
  ),

  defaultLanguage: process.env.DEFAULT_LANGUAGE || null,
  supportedLanguages: process.env.SUPPORTED_LANGUAGES
    ? process.env.SUPPORTED_LANGUAGES.split(',').map((l) => l.trim())
    : null,

  theme: ThemeSchema.parse(process.env.THEME ? JSON.parse(process.env.THEME) : defaultTheme),
};
