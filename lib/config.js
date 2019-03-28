/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};
const mailgunSandboxDomain = 'sandboxbce1882219304564a54834d8a704999b.mailgun.org';

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 443,
  envName: "staging",
  hashingSecret: "thisIsASecret",
  maxChecks: 5,
  'stripeApiKey': 'sk_test_cT0C91EpvVAhfMMg95MB7eBV',
  'mailgunSandboxDomain': mailgunSandboxDomain,
  'mailgunFrom': 'Pizza Boy <postmaster@' + mailgunSandboxDomain + '>',
  'mailgunApiKey': '6cf3bfbdc7bf5b838ca4628068969728-7caa9475-4d781759',
};

// Production environment
environments.production = {
  'httpPort': 3000,
  'httpsPort': 443,
  'envName': 'production',
  'hashingSecret': 'This is my hashing secret',
  'stripeApiKey': 'sk_test_cT0C91EpvVAhfMMg95MB7eBV',
  'mailgunSandboxDomain': mailgunSandboxDomain,
  'mailgunFrom': 'Pizza Boy <mailgun@' + environments.staging.sandboxDomain + '>',
  'mailgunApiKey': '6cf3bfbdc7bf5b838ca4628068969728-7caa9475-4d781759'
};

// Determine which environment was set in the command-line
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if the currentEnvironment variable matches with one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
