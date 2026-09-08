// ============================================================================
// 4. useReducer: assessmentReducer.js
// Manages the state transitions for the Skin Assessment form.
// Handles complex state updates deterministically through dispatched actions.
// ============================================================================

export const initialFormState = {
  name: 'Khushi',
  age: 19,
  skinType: 'Combination', // 'Normal' | 'Dry' | 'Oily' | 'Combination'
  waterIntake: 2.5,        // in Liters / day
  sunExposure: 2,          // hours / day
  concerns: ['Hydration', 'Sun Protection'],
  step: 1,                 // 1: Personal Info, 2: Skin Attributes, 3: Habits
  errors: {}
};

export const ASSESSMENT_ACTIONS = {
  UPDATE_FIELD: 'UPDATE_FIELD',
  RESET_FORM: 'RESET_FORM',
  SET_FORM_DATA: 'SET_FORM_DATA',
  SET_STEP: 'SET_STEP',
  SET_ERRORS: 'SET_ERRORS'
};

// // useReducer: Reducer function handling state transitions
export function assessmentReducer(state, action) {
  switch (action.type) {
    case ASSESSMENT_ACTIONS.UPDATE_FIELD:
      // // useReducer: Action UPDATE_FIELD updates a specific key/value pair
      return {
        ...state,
        [action.field]: action.value,
        errors: {
          ...state.errors,
          [action.field]: null // Clear error when user edits
        }
      };

    case ASSESSMENT_ACTIONS.SET_STEP:
      return {
        ...state,
        step: action.step
      };

    case ASSESSMENT_ACTIONS.SET_ERRORS:
      return {
        ...state,
        errors: action.errors || {}
      };

    case ASSESSMENT_ACTIONS.RESET_FORM:
      // // useReducer: Action RESET_FORM restores form back to initial baseline
      return {
        ...initialFormState,
        name: action.defaultName || 'Khushi'
      };

    case ASSESSMENT_ACTIONS.SET_FORM_DATA:
      // // useReducer: Action to hydrate form from loaded localStorage assessment
      return {
        ...state,
        ...action.payload,
        step: 1,
        errors: {}
      };

    default:
      return state;
  }
}
