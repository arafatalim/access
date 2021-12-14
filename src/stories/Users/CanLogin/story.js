const validator = requireValidator();
const attributesRepo = requireRepo("attributes");
const usersRepo = requireRepo("users");
const findKeysFromRequest = requireUtil("findKeysFromRequest");
const getAllowedTypes = requireFunction("getAllowedTypes");

const prepare = ({ req }) => {
  const payload = findKeysFromRequest(req, ["type", "value", "password"]);
  return payload;
};

const authorize = ({ prepareResult }) => {
  // Anyone can access this endpoint
  return true;
};

const validateInput = async (payload) => {
  const constraints = {
    password: {
      presence: {
        allowEmpty: false,
        message: "^Please enter password",
      },
    },
    type: {
      presence: {
        allowEmpty: false,
        message: "^Please choose type",
      },
      inclusion: {
        within: getAllowedTypes(),
        message: "^Please choose valid type",
      },
    },
    value: {
      presence: {
        allowEmpty: false,
        message: "^Please enter a value",
      },
      type: "string",
      custom_callback: {
        message: "Invalid username or password",
        callback: async (payload) => {
          let count =
            typeof payload.value === "string"
              ? await attributesRepo.countAll({
                  value: payload.value,
                  type: payload.type,
                })
              : -1;
          return count === 1 ? true : false;
        },
      },
    },
  };

  return validator(payload, constraints);
};

const handle = async ({ prepareResult }) => {
  try {
    let inputPayload = { ...prepareResult };
    await validateInput(inputPayload);
    return await usersRepo.authenticateWithPassword(prepareResult);
  } catch (error) {
    throw error;
  }
};

const respond = ({ handleResult }) => {
  return handleResult;
};

module.exports = {
  prepare,
  authorize,
  handle,
  respond,
};