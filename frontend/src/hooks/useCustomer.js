import { useContext } from 'react'
import { CustomerContext } from '../context/customerContextInstance'

function useCustomer() {
  const context = useContext(CustomerContext)

  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }

  return context
}

export default useCustomer
