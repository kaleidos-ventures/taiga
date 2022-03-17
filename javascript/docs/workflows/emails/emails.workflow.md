## MJML emails

Email templates are located in the following folder `javascript/apps/taiga-mjml/templates`, here is where we should apply changes.
The compiled emails are located in `python/apps/taiga/src/taiga/emails/templates`, we never make changes in this folder.

To compile our emails we should run `npm run emails`.
Also, there are three separated scripts for each task:

- `npm run emails:compile-html`
- `npm run emails:copy-text`
- `npm run emails:copy-subject`

## Documentation

Find more information about MJML [here](https://documentation.mjml.io/)

## Workflow to create an email from the scratch

1. We should create three files in `javascript/apps/taiga-mjml/templates`:

- \*.mjml.html.jinja: html email
- \*.txt.jinja: plain text email
- \*.subject.jinja: subject of the email
  There are componentes in `javascript/apps/taiga-mjml/components` to ease the job and common styles in `javascript/apps/taiga-mjml/styles` folder.

In the styles folder we have three files:

- attributes.mjml: this one overrides the default settings of mjml. To use it in the template we should put `mj-class="name-attribute"` in the mjml component.
- common.mjml: here we have css styles. To use it in the template we should put `css-class="class-name"`.
- dark_mode.mjml: as their name says, here we have all the dark mode styles.

2. Once the email is done, we should test it on [emailonacid](https://app.emailonacid.com/). See section 'How to test on emailonacid' for more information.
3. When the email is finished we have to notify the back team to apply the necessary interpolations in the template.

## How to get a compiled finished email with real URLs

Once back is done adding things to the template, we generate the final version of the email with working URLs (Some email browser have problem with fakes URL). This version is the one that design has to review.

This are the step to generate the HTML of the final version:

1. Make sure to`npm run emails` to have the latest render version
2. Go into python/apps/taiga/
3. Make you to have have VENV up.
4. Use command `python -m taiga emails render NAMEOFEMAILTORENDER`
   ex: `python -m taiga emails render sign_up`

## How to test on emailonacid

1. After login we should go to the projects section. Add 'New project' and we'll chose the option 'Email editor'.
2. We fill the create project form with the following configuration:

- Project Name and Subject line: the same as our template filename.
- Select option 'Start from scratch'
- From the email clients list we should select the profile create by the ui team.
- Activate the 'Include a preview of each client with image blocking enabled'.

3. Then, we'll paste our compiled html to the edit side and we'll save it.
4. We should move to the tab 'Test' in the right section to see all the email clients previews. If we want to make changes in our html, we could but, it's necessary to saved to see every change and also, after that, click the 'Resubmit all screenshots' green button on the right side with the sync icon.
