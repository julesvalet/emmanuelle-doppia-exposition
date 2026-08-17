import type { ChangeEvent, FormEvent } from 'react'
import { useLanguage } from '../i18n'
import type { AddressInput } from '../addresses'

type Props = {
  idPrefix: string
  value: AddressInput
  onChange: (value: AddressInput) => void
  onSubmit: (event: FormEvent) => void
  submitLabel: string
  submitting?: boolean
  onCancel?: () => void
  cancelLabel?: string
}

// Shared by the checkout shipping step and the account "Addresses" tab — same six fields
// (address/postal code/city/country required, floor/door name optional) either way.
export function AddressForm({ idPrefix, value, onChange, onSubmit, submitLabel, submitting, onCancel, cancelLabel }: Props) {
  const { t } = useLanguage()

  const field = (key: keyof AddressInput) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [key]: event.target.value })
  }

  return (
    <form className="account-panel__form" onSubmit={onSubmit}>
      <div className="account-panel__field">
        <label htmlFor={`${idPrefix}-address`}>{t.cart.shippingAddressLabel}</label>
        <input id={`${idPrefix}-address`} type="text" autoComplete="street-address" required value={value.address} onChange={field('address')} />
      </div>
      <div className="account-panel__field">
        <label htmlFor={`${idPrefix}-postal-code`}>{t.cart.shippingPostalCodeLabel}</label>
        <input id={`${idPrefix}-postal-code`} type="text" autoComplete="postal-code" required value={value.postalCode} onChange={field('postalCode')} />
      </div>
      <div className="account-panel__field">
        <label htmlFor={`${idPrefix}-city`}>{t.cart.shippingCityLabel}</label>
        <input id={`${idPrefix}-city`} type="text" autoComplete="address-level2" required value={value.city} onChange={field('city')} />
      </div>
      <div className="account-panel__field">
        <label htmlFor={`${idPrefix}-country`}>{t.cart.shippingCountryLabel}</label>
        <input id={`${idPrefix}-country`} type="text" autoComplete="country-name" required value={value.country} onChange={field('country')} />
      </div>
      <div className="account-panel__field">
        <label htmlFor={`${idPrefix}-floor`}>{t.cart.shippingFloorLabel} <small>({t.cart.shippingOptional})</small></label>
        <input id={`${idPrefix}-floor`} type="text" autoComplete="off" value={value.floor} onChange={field('floor')} />
      </div>
      <div className="account-panel__field">
        <label htmlFor={`${idPrefix}-door-name`}>{t.cart.shippingDoorNameLabel} <small>({t.cart.shippingOptional})</small></label>
        <input id={`${idPrefix}-door-name`} type="text" autoComplete="off" value={value.doorName} onChange={field('doorName')} />
        <small>{t.cart.shippingDoorNameHint}</small>
      </div>
      <button type="submit" className="cart-panel__checkout" disabled={submitting}>{submitLabel}</button>
      {onCancel && <button type="button" className="cart-panel__back" onClick={onCancel}>{cancelLabel}</button>}
    </form>
  )
}
