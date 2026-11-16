module.exports = {
  inputs: {
    subject: {
      type: 'string',
      required: true,
    },
    heading: {
      type: 'string',
      required: true,
    },
    body: {
      type: 'string',
      required: true,
    },
    buttonUrl: {
      type: 'string',
    },
    buttonLabel: {
      type: 'string',
    },
  },

  sync: true,

  fn(inputs) {
    const baseUrl = process.env.BASE_URL || '';
    const buttonLabel = inputs.buttonLabel || `Ouvrir ${sails.config.custom.serviceName}`;

    const logoUrl = `${baseUrl}/logo-projets.png`;
    const gouvLogoUrl = `${baseUrl}/logo-gouv.png`;
    const anctLogoUrl = `${baseUrl}/logo-anct.png`;

    const buttonHtml = inputs.buttonUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:32px auto 0;">
          <tr>
            <td style="background-color:#3E5DE7;border-radius:4px;height:40px;">
              <a href="${inputs.buttonUrl}" style="display:inline-block;height:40px;line-height:40px;padding:0 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;">
                &#8599;&nbsp;&nbsp;${buttonLabel}
              </a>
            </td>
          </tr>
        </table>`
      : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${inputs.subject}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-outer { padding: 16px 0 !important; }
      .email-inner { width: 100% !important; border-radius: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;">${inputs.subject}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" class="email-outer" style="padding:32px 16px;">
        <!-- View in browser -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-inner" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-inner" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:100px 32px 100px 32px;">
              <a href="${baseUrl}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logoUrl}" alt="${sails.config.custom.serviceName}" height="40" style="display:block;border:0;height:48px;width:auto;" />
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          <!-- Info banner -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:48px;padding:0 16px;background-color:#e8edff;border-radius:4px;border:1px solid #C8D3FF;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:8px;">
                          <span style="font-size:16px;color:#000091;">&#9432;</span>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:14px;color:#000091;font-weight:500;">${inputs.heading}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body content -->
          <tr>
            <td style="padding:0 32px 32px;">
              <div style="color:#3a3a3a;font-size:14px;line-height:1.6;">
                ${inputs.body}
              </div>
              ${buttonHtml}
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>
          <!-- Footer logos -->
          <tr>
            <td style="padding:40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;width:50%;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:16px;">
                          <img src="${gouvLogoUrl}" alt="République Française" height="48" style="display:block;border:0;height:48px;width:auto;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <img src="${anctLogoUrl}" alt="ANCT" height="48" style="display:block;border:0;height:48px;width:auto;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <a href="https://docs.suite.anct.gouv.fr/docs/b77fef2d-ee20-4f3b-b795-e8210849331c/" style="display:block;font-size:12px;color:#666666;text-decoration:underline;">Politique de confidentialité</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  },
};
