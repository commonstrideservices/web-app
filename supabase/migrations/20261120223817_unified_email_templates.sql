alter table app_private.email_templates
  add column html text,
  add constraint email_templates_html_length check (html is null or length(html) between 1 and 40000);
