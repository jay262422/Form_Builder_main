import TextInput from './TextInput';
import TextArea from './TextArea';
import Select from './Select';
import MultiSelect from './MultiSelect';
import Checkbox from './Checkbox';
import RadioGroup from './RadioGroup';
import FileUpload from './FileUpload';
import DatePicker from './DatePicker';
import NumberInput from './NumberInput';
import EmailInput from './EmailInput';
import PhoneInput from './PhoneInput';
import PasswordInput from './PasswordInput';
import Toggle from './Toggle';
import UrlInput from './UrlInput';
import TimePicker from './TimePicker';
import RangeSlider from './RangeSlider';

// Phase 3 Advanced Field Types
import RatingInput from './RatingInput';
import ColorInput from './ColorInput';
import CalculatedInput from './CalculatedInput';
import SignatureInput from './SignatureInput';
import RepeaterInput from './RepeaterInput';
import AddressInput from './AddressInput';
import PhoneAdvancedInput from './PhoneAdvancedInput';
import CurrencyInput from './CurrencyInput';
import PercentageInput from './PercentageInput';

/**
 * FieldRegistry - Maps field types to their components
 * Add new field types here to extend the form builder
 */
const FieldRegistry = {
  // Basic input types
  text: TextInput,
  email: EmailInput,
  password: PasswordInput,
  phone: PhoneInput,
  number: NumberInput,
  textarea: TextArea,
  
  // Selection types
  select: Select,
  multiselect: MultiSelect,
  checkbox: Checkbox,
  radio: RadioGroup,
  toggle: Toggle,
  
  // Special types
  file: FileUpload,
  date: DatePicker,
  url: UrlInput,
  time: TimePicker,
  range: RangeSlider,
  
  // Phase 3 Advanced Field Types
  rating: RatingInput,
  color: ColorInput,
  calculated: CalculatedInput,
  signature: SignatureInput,
  repeater: RepeaterInput,
  address: AddressInput,
  phone_advanced: PhoneAdvancedInput,
  currency: CurrencyInput,
  percentage: PercentageInput,
  
  // Aliases for backward compatibility
  input: TextInput,
  dropdown: Select,
  'checkbox-list': MultiSelect,
  'radio-group': RadioGroup,
  'file-upload': FileUpload,
  'date-picker': DatePicker,
  'url-input': UrlInput,
  'time-picker': TimePicker,
  'range-slider': RangeSlider,
};

export default FieldRegistry; 