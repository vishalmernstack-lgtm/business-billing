import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  InputLabel,
  Alert,
  Autocomplete,
} from '@mui/material'
import {
  Add,
  Delete,
  Save,
  ArrowBack,
  Person,
  Receipt,
  Phone,
  LocationOn,
  AttachMoney,
  CalendarToday,
  ExpandMore,
  CheckCircle,
  CameraAlt,
} from '@mui/icons-material'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

import {
  useCreateBillMutation,
  useUpdateBillMutation,
  useGetBillQuery,
  useGetActiveItemsQuery,
} from '../../store/api/apiSlice'

// Simplified schemas to avoid read-only property issues
const createItemSchema = () => {
  return yup.object().shape({
    itemType: yup.string().oneOf(['select', 'manual']).default('select'),
    itemId: yup.string().nullable(),
    itemName: yup.string().required('Item name is required').test('not-empty', 'Item name cannot be empty', value => value && value.trim() !== ''),
    quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required').typeError('Quantity must be a number'),
    unitPrice: yup.number().min(0.01, 'Unit price must be greater than 0').required('Unit price is required').typeError('Unit price must be a number'),
  })
}

const createReferenceSchema = () => {
  return yup.object().shape({
    name: yup.string().nullable(),
    number: yup.string().nullable().test('phone-format', 'Phone number must be exactly 10 digits', function(value) {
      if (!value || value.trim() === '') return true
      return /^[0-9]{10}$/.test(value)
    }),
    gender: yup.string().oneOf(['Male', 'Female', 'Other', '']).nullable(),
    village: yup.string().nullable(),
    photo: yup.mixed().nullable(),
    aadhaarPhoto: yup.mixed().nullable(),
    panPhoto: yup.mixed().nullable(),
  })
}

const createMainSchema = () => {
  return yup.object().shape({
    clientName: yup.string().required('Client name is required'),
    clientNumber: yup.string()
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .required('Phone number is required'),
    clientGender: yup.string().oneOf(['Male', 'Female', 'Other']).required('Gender is required'),
    clientVillage: yup.string().required('Village is required'),
    clientPhoto: yup.mixed().nullable(),
    clientAadhaarPhoto: yup.mixed().nullable(),
    clientPanPhoto: yup.mixed().nullable(),
    references: yup.array().of(createReferenceSchema()).nullable(),
    items: yup.array().of(createItemSchema()).min(1, 'At least one item is required'),
    paidAmount: yup.number().min(0, 'Payment amount cannot be negative').default(0),
    status: yup.string().oneOf(['Paid', 'Unpaid', 'Partial']).required('Payment status is required'),
    paymentDate: yup.date().nullable(),
  })
}

const BillFormPage = () => {
  try {
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const isEdit = !!id
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  // State for image previews
  const [imagePreviews, setImagePreviews] = useState({
    clientPhoto: null,
    clientAadhaarPhoto: null,
    clientPanPhoto: null,
    references: {}
  })

  // State for existing photos from backend
  const [existingPhotos, setExistingPhotos] = useState({
    clientPhoto: null,
    clientAadhaar: null,
    clientPan: null
  })

  const [activeStep, setActiveStep] = useState(0)

  // Handle file selection and preview
  const handleFileSelect = (fieldName, file, referenceIndex = null) => {
    if (!file) return

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    
    // Update form value
    if (referenceIndex !== null) {
      setValue(`references.${referenceIndex}.${fieldName}`, file)
      setImagePreviews(prev => ({
        ...prev,
        references: {
          ...prev.references,
          [`${referenceIndex}_${fieldName}`]: previewUrl
        }
      }))
      toast.success(`Reference ${fieldName} captured successfully!`)
    } else {
      setValue(fieldName, file)
      setImagePreviews(prev => ({
        ...prev,
        [fieldName]: previewUrl
      }))
      toast.success(`${fieldName} captured successfully!`)
    }
  }

  const [createBill, { isLoading: creating }] = useCreateBillMutation()
  const [updateBill, { isLoading: updating }] = useUpdateBillMutation()
  
  // Fetch existing bill data when in edit mode
  const { data: billData, isLoading: loadingBill, error: billError } = useGetBillQuery(id, {
    skip: !isEdit,
    // Add timeout to prevent hanging
    pollingInterval: 0,
    refetchOnMountOrArgChange: true,
  })

  const { data: itemsData, isLoading: loadingItems } = useGetActiveItemsQuery()
  const availableItems = itemsData?.data || []

  // Debug logging and manual API test
  useEffect(() => {
    if (isEdit) {
      console.log('Edit mode - Bill ID:', id)
      console.log('Loading bill:', loadingBill)
      console.log('Bill data:', billData)
      console.log('Bill error:', billError)
      
      // Log when both APIs are ready
      if (billData?.data && !loadingBill && !loadingItems) {
        console.log('✅ Both APIs loaded successfully - ready for form population')
        console.log('Bill details:', {
          clientName: billData.data.clientDetails?.clientName,
          itemsCount: billData.data.items?.length,
          status: billData.data.status,
          totalAmount: billData.data.totalAmount
        })
      }
    }
  }, [isEdit, id, loadingBill, billData, billError, loadingItems])

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      // Cleanup object URLs to prevent memory leaks
      Object.values(imagePreviews).forEach(url => {
        if (url && typeof url === 'string') {
          URL.revokeObjectURL(url)
        }
      })
      Object.values(imagePreviews.references || {}).forEach(url => {
        if (url && typeof url === 'string') {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  // Add timeout for loading state
  useEffect(() => {
    if (isEdit && loadingBill) {
      const timeout = setTimeout(() => {
        console.error('Bill loading timeout - request taking too long')
        toast.error('Loading bill data is taking too long. Please try again.')
      }, 15000) // 15 second timeout

      return () => clearTimeout(timeout)
    }
  }, [isEdit, loadingBill])

  // Debug log
  console.log('Items data:', itemsData)
  console.log('Available items:', availableItems)
  console.log('Loading items:', loadingItems)

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Handle file upload and convert to base64 or URL
  const handleFileUpload = (file) => {
    if (!file || file.length === 0) return ''
    
    // If it's a FileList, get the first file
    const actualFile = file[0] || file
    
    if (actualFile instanceof File) {
      // For now, return the file name. In a real app, you'd upload to a server
      // and return the URL, or convert to base64 for storage
      console.log('📸 File selected:', actualFile.name, 'Size:', actualFile.size, 'Type:', actualFile.type)
      toast.success(`Photo captured: ${actualFile.name}`)
      return actualFile.name
    }
    
    return ''
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm({
    resolver: yupResolver(createMainSchema()),
    defaultValues: {
      clientName: '',
      clientNumber: '',
      clientGender: 'Male', // Default to Male
      clientVillage: '',
      clientPhoto: null,
      clientAadhaarPhoto: null,
      clientPanPhoto: null,
      references: [], // Start with empty array
      items: [{ itemType: 'select', itemId: '', itemName: '', quantity: 1, unitPrice: 0 }],
      paidAmount: 0,
      status: 'Unpaid', // Default to Unpaid
      paymentDate: getCurrentDate(),
      paymentHistory: [],
    },
  })

  const { fields: itemFields, append: appendItem, remove: removeItem, prepend: prependItem } = useFieldArray({
    control,
    name: 'items',
  })

  const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
    control,
    name: 'references',
  })

  const watchedItems = watch('items')
  const watchedPaidAmount = watch('paidAmount') || 0
  const watchedStatus = watch('status')
  const watchedClientVillage = watch('clientVillage')
  const watchedReferences = watch('references')

  // Populate form with existing bill data when in edit mode
  useEffect(() => {
    if (isEdit && billData?.data && !loadingBill) {
      const bill = billData.data
      console.log('🔄 Starting form population with bill data:', bill)
      
      // Set client details
      setValue('clientName', bill.clientDetails?.clientName || '')
      setValue('clientNumber', bill.clientDetails?.phoneNumber || '')
      setValue('clientGender', bill.clientDetails?.gender || '')
      setValue('clientVillage', bill.clientDetails?.village || '')
      
      // Don't set imagePreviews for existing photos - let them show via billData
      // imagePreviews should only be used for newly captured photos (blob URLs)
      
      // Handle references - populate if they exist
      if (bill.references && bill.references.length > 0) {
        const newReferences = bill.references.map((ref, index) => ({
          name: ref.name || '',
          number: ref.phoneNumber || '',
          gender: ref.gender || '',
          village: ref.village || bill.clientDetails?.village || '',
          photo: ref.photo || '',
          aadhaarPhoto: ref.aadhaarPhoto || '',
          panPhoto: ref.panPhoto || ''
        }))
        
        setValue('references', newReferences)
        console.log('📋 Populated references:', newReferences.length)
      } else {
        setValue('references', [])
      }
      
      // Handle items - determine if they were created from item selection or manual entry
      const newItems = []
      if (bill.items && bill.items.length > 0) {
        bill.items.forEach((item) => {
          // Try to find matching item in available items to determine if it was selected or manual
          const matchingItem = availableItems.find(availItem => 
            availItem.name === item.itemName && availItem.unitPrice === item.unitPrice
          )
          
          if (matchingItem) {
            // This was a selected item
            newItems.push({
              itemType: 'select',
              itemId: matchingItem._id,
              itemName: item.itemName,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0
            })
            console.log('📦 Found selected item:', item.itemName, 'ID:', matchingItem._id)
          } else {
            // This was a manual item
            newItems.push({
              itemType: 'manual',
              itemId: '',
              itemName: item.itemName || '',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0
            })
            console.log('✏️ Found manual item:', item.itemName)
          }
        })
      } else {
        // Ensure at least one empty item if no items exist
        newItems.push({
          itemType: 'select',
          itemId: '',
          itemName: '',
          quantity: 1,
          unitPrice: 0
        })
      }
      
      setValue('items', newItems)
      console.log('� Populated items:', newItems.length)
      
      // Set other bill details
      setValue('paidAmount', bill.paidAmount || 0)
      setValue('status', bill.status === 'Sent' ? 'Unpaid' : bill.status || 'Unpaid')
      
      // Handle payment date - use existing date or current date
      if (bill.paymentDate) {
        setValue('paymentDate', new Date(bill.paymentDate).toISOString().split('T')[0])
        console.log('📅 Set existing payment date:', bill.paymentDate)
      } else {
        // Set current date as default
        setValue('paymentDate', getCurrentDate())
        console.log('📅 Set current date as default')
      }
      
      console.log('✅ Form population completed successfully')
      
      // Force form re-render to show populated values
      setTimeout(() => {
        console.log('🔄 Triggering form re-render')
      }, 100)
    }
  }, [isEdit, billData, loadingBill, setValue, availableItems])

  // Calculate totals
  const subtotal = watchedItems?.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity) || 0
    const unitPrice = parseFloat(item.unitPrice) || 0
    return sum + (quantity * unitPrice)
  }, 0) || 0

  const totalAmount = subtotal

  // Auto-calculate status based on payment amount
  useEffect(() => {
    const paidAmount = parseFloat(watchedPaidAmount) || 0
    const total = parseFloat(totalAmount) || 0
    
    if (paidAmount === 0) {
      setValue('status', 'Unpaid')
      setValue('paymentDate', null)
    } else if (paidAmount >= total) {
      setValue('status', 'Paid')
      if (!watch('paymentDate')) {
        setValue('paymentDate', getCurrentDate())
      }
    } else if (paidAmount > 0 && paidAmount < total) {
      setValue('status', 'Partial')
      if (!watch('paymentDate')) {
        setValue('paymentDate', getCurrentDate())
      }
    }
  }, [watchedPaidAmount, totalAmount, setValue, watch])

  // Auto-fill reference village when client village changes
  useEffect(() => {
    if (watchedClientVillage && watchedReferences && Array.isArray(watchedReferences)) {
      watchedReferences.forEach((ref, index) => {
        if (ref && !ref.village) {
          setValue(`references.${index}.village`, watchedClientVillage)
        }
      })
    }
  }, [watchedClientVillage, setValue, watchedReferences])

  // Pre-fill client data from URL parameters (when creating new bill from client)
  useEffect(() => {
    if (!isEdit) {
      const phoneParam = searchParams.get('phone')
      const nameParam = searchParams.get('name')
      const genderParam = searchParams.get('gender')
      const villageParam = searchParams.get('village')
      
      if (phoneParam) {
        console.log('=== CLIENT DATA PRE-FILL FROM URL ===')
        console.log('📞 Phone:', phoneParam)
        console.log('👤 Name:', nameParam)
        console.log('⚧ Gender:', genderParam)
        console.log('🏘️ Village:', villageParam)
        
        // Pre-fill client data from URL parameters
        if (nameParam) setValue('clientName', nameParam)
        if (phoneParam) setValue('clientNumber', phoneParam)
        if (genderParam) setValue('clientGender', genderParam)
        if (villageParam) setValue('clientVillage', villageParam)
        
        console.log('✅ Client data pre-filled from URL parameters')
        
        // If we have all the basic data, show success message
        if (nameParam && phoneParam && genderParam && villageParam) {
          toast.success(`Client details loaded: ${nameParam}`)
        } else {
          // If we only have phone, try to fetch from backend
          console.log('⚠️ Incomplete data in URL, attempting to fetch from backend...')
          
          const fetchClientByPhone = async () => {
            try {
              const apiUrl = `http://localhost:5000/api/clients?search=${phoneParam}&limit=1`
              console.log('🌐 API URL:', apiUrl)
              
              const token = localStorage.getItem('token')
              const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (response.ok) {
                const data = await response.json()
                console.log('📦 API Response:', data)
                
                if (data.success && data.data?.clients?.length > 0) {
                  const client = data.data.clients[0]
                  console.log('✅ Client found in database!')
                  
                  // Only fill missing fields
                  if (!nameParam) setValue('clientName', client.clientName || '')
                  if (!genderParam) setValue('clientGender', client.gender || '')
                  if (!villageParam) setValue('clientVillage', client.village || '')
                  
                  // Set existing photos if available
                  const baseUrl = 'http://localhost:5000'
                  if (client.documents?.photo) {
                    setExistingPhotos(prev => ({ ...prev, clientPhoto: `${baseUrl}/${client.documents.photo}` }))
                  }
                  if (client.documents?.aadhaarCard) {
                    setExistingPhotos(prev => ({ ...prev, clientAadhaar: `${baseUrl}/${client.documents.aadhaarCard}` }))
                  }
                  if (client.documents?.panCard) {
                    setExistingPhotos(prev => ({ ...prev, clientPan: `${baseUrl}/${client.documents.panCard}` }))
                  }
                  
                  toast.success(`Client details loaded: ${client.clientName}`)
                } else {
                  console.log('ℹ️ Client not found in database')
                  toast('Client data loaded from bill. Please verify details.', { icon: 'ℹ️' })
                }
              }
            } catch (error) {
              console.error('❌ Error fetching from backend:', error.message)
              // Not a critical error - we already have data from URL
              toast('Client data loaded from bill. Please verify details.', { icon: 'ℹ️' })
            }
          }
          
          fetchClientByPhone()
        }
        
        console.log('=== CLIENT DATA PRE-FILL END ===')
      }
    }
  }, [isEdit, searchParams, setValue])

  // PDF Generation Function
  const generatePDF = async (billData, formData) => {
    try {
      const pdf = new jsPDF()
      
      // Company Header
      pdf.setFontSize(20)
      pdf.setTextColor(40, 40, 40)
      pdf.text('BUSINESS BILLING INVOICE', 20, 30)
      
      // Bill Details
      pdf.setFontSize(12)
      pdf.text(`Bill Number: ${billData.billNumber || 'N/A'}`, 20, 50)
      pdf.text(`Date: ${new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })}`, 20, 60)
      pdf.text(`Status: ${formData.status}`, 20, 70)
      
      // Client Details
      pdf.setFontSize(14)
      pdf.text('CLIENT DETAILS:', 20, 90)
      pdf.setFontSize(12)
      pdf.text(`Name: ${formData.clientName}`, 20, 105)
      pdf.text(`Phone: ${formData.clientNumber}`, 20, 115)
      pdf.text(`Gender: ${formData.clientGender}`, 20, 125)
      pdf.text(`Village: ${formData.clientVillage}`, 20, 135)
      
      // Items Table
      pdf.setFontSize(14)
      pdf.text('ITEMS:', 20, 155)
      
      let yPosition = 170
      pdf.setFontSize(10)
      pdf.text('Item', 20, yPosition)
      pdf.text('Qty', 120, yPosition)
      pdf.text('Price', 140, yPosition)
      pdf.text('Total', 170, yPosition)
      
      yPosition += 10
      pdf.line(20, yPosition, 190, yPosition) // Header line
      yPosition += 10
      
      formData.items.forEach((item, index) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0)
        pdf.text(item.itemName || 'N/A', 20, yPosition)
        pdf.text(String(item.quantity || 0), 120, yPosition)
        pdf.text(`₹${(item.unitPrice || 0).toFixed(2)}`, 140, yPosition)
        pdf.text(`₹${itemTotal.toFixed(2)}`, 170, yPosition)
        yPosition += 10
      })
      
      // Totals
      yPosition += 10
      pdf.line(20, yPosition, 190, yPosition) // Total line
      yPosition += 10
      
      pdf.setFontSize(12)
      pdf.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 120, yPosition)
      yPosition += 10
      pdf.setFontSize(14)
      pdf.text(`TOTAL: ₹${totalAmount.toFixed(2)}`, 120, yPosition)
      
      // Payment Details
      if (formData.status === 'Paid' && formData.paymentDate) {
        yPosition += 20
        pdf.setFontSize(12)
        pdf.text(`Payment Date: ${new Date(formData.paymentDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })}`, 20, yPosition)
      }
      
      // Save PDF
      const fileName = `Bill_${formData.clientName}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      // Create blob for WhatsApp sharing
      const pdfBlob = pdf.output('blob')
      shareToWhatsApp(pdfBlob, fileName, formData)
      
      toast.success('PDF generated successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    }
  }

  // WhatsApp Sharing Function
  const shareToWhatsApp = (pdfBlob, fileName, formData) => {
    try {
      // Create a URL for the PDF blob
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Create message text
      const message = `Hi ${formData.clientName},\n\nYour bill has been generated.\nTotal Amount: ₹${totalAmount.toFixed(2)}\nStatus: ${formData.status}\n\nThank you for your business!`
      
      // WhatsApp Web URL with message
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank')
      
      // Also create a download link for the PDF
      const downloadLink = document.createElement('a')
      downloadLink.href = pdfUrl
      downloadLink.download = fileName
      downloadLink.click()
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
      
      toast.success('WhatsApp opened! PDF downloaded for manual sharing.')
    } catch (error) {
      console.error('WhatsApp sharing error:', error)
      toast.error('Failed to share to WhatsApp')
    }
  }

  const onSubmit = async (data) => {
    try {
      // Enhanced validation for items
      const itemValidationErrors = []
      data.items.forEach((item, index) => {
        // Check if item has a name
        if (!item.itemName || item.itemName.trim() === '') {
          itemValidationErrors.push(`Item ${index + 1}: Item name is required`)
        }
        
        // Check if itemType is 'select' and itemId is missing
        if (item.itemType === 'select' && !item.itemId) {
          itemValidationErrors.push(`Item ${index + 1}: Please select an item from the list`)
        }
        
        // Check if quantity is valid
        if (!item.quantity || item.quantity <= 0) {
          itemValidationErrors.push(`Item ${index + 1}: Quantity must be at least 1`)
        }
        
        // Check if unit price is provided
        if (!item.unitPrice || item.unitPrice <= 0) {
          itemValidationErrors.push(`Item ${index + 1}: Unit price is required and must be greater than 0`)
        }
      })
      
      if (itemValidationErrors.length > 0) {
        // Show all validation errors
        itemValidationErrors.forEach(error => toast.error(error))
        return
      }

      // Custom validation for payment date when status is 'Paid'
      if (data.status === 'Paid' && !data.paymentDate) {
        toast.error('Payment date is required for paid bills')
        return
      }

      console.log('Form data:', data)
      
      // Check if we have any files to upload
      const hasFiles = (data.clientPhoto instanceof File) || 
                      (data.clientAadhaarPhoto instanceof File) || 
                      (data.clientPanPhoto instanceof File)

      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData()
        
        // Prepare client details (embedded in bill)
        const clientDetails = {
          clientName: data.clientName,
          phoneNumber: data.clientNumber,
          gender: data.clientGender,
          village: data.clientVillage,
        }

        // Add client files to FormData
        if (data.clientPhoto instanceof File) {
          formData.append('photo', data.clientPhoto)
        }
        if (data.clientAadhaarPhoto instanceof File) {
          formData.append('aadhaarCard', data.clientAadhaarPhoto)
        }
        if (data.clientPanPhoto instanceof File) {
          formData.append('panCard', data.clientPanPhoto)
        }

        // Prepare references (optional, embedded in bill)
        const references = []
        if (data.references && data.references.length > 0) {
          data.references.forEach(ref => {
            // Only create reference if at least name OR phone number is provided
            if ((ref.name && ref.name.trim()) || (ref.number && ref.number.trim())) {
              references.push({
                name: ref.name?.trim() || '',
                phoneNumber: ref.number?.trim() || '',
                gender: ref.gender?.trim() || '', // Allow empty gender
                village: ref.village?.trim() || data.clientVillage || '',
              })
            }
          })
        }

        // Prepare items data
        const processedItems = data.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))

        console.log('FormData bill data before sending:', {
          clientDetails,
          references,
          items: processedItems,
          subtotal,
          totalAmount,
          paidAmount: parseFloat(data.paidAmount) || 0,
          status: data.status === 'Unpaid' ? 'Sent' : data.status,
          paymentDate: data.paymentDate,
          paymentDateType: typeof data.paymentDate
        })

        // Create bill data object
        const billData = {
          clientDetails, // Embedded client details
          references, // Embedded references (optional)
          items: processedItems,
          subtotal,
          totalAmount,
          paidAmount: parseFloat(data.paidAmount) || 0,
          status: data.status === 'Unpaid' ? 'Sent' : data.status, // Map Unpaid back to Sent
          paymentDate: data.paymentDate || null, // Ensure it's null if empty
        }

        // Add bill data as JSON strings to FormData
        Object.keys(billData).forEach(key => {
          if (key === 'paymentDate') {
            // Handle paymentDate specially
            if (billData[key]) {
              formData.append(key, billData[key])
              console.log('Appending paymentDate:', billData[key])
            } else {
              formData.append(key, '') // Send empty string instead of null
              console.log('Appending empty paymentDate')
            }
          } else {
            formData.append(key, typeof billData[key] === 'object' ? JSON.stringify(billData[key]) : billData[key])
          }
        })

        console.log('Creating bill with FormData')

        // Use fetch for FormData
        const baseUrl = import.meta.env.VITE_API_URL
        const token = localStorage.getItem('token')
        
        const url = isEdit ? `${baseUrl}/bills/${id}` : `${baseUrl}/bills`
        const method = isEdit ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData, let browser set it
          },
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Failed to save bill')
        }

        console.log('Bill saved:', result)
        toast.success(`Bill ${isEdit ? 'updated' : 'created'} successfully`)
        
        if (!isEdit) {
          // Generate and download PDF for new bills
          generatePDF(result.data, data)
        }
        
        navigate('/bills')
      } else {
        // No files to upload, use regular JSON
        // Prepare client details (embedded in bill)
        const clientDetails = {
          clientName: data.clientName,
          phoneNumber: data.clientNumber,
          gender: data.clientGender,
          village: data.clientVillage,
          // Keep existing photos if no new ones uploaded
          photo: data.clientPhoto || '',
          aadhaarPhoto: data.clientAadhaarPhoto || '',
          panPhoto: data.clientPanPhoto || '',
        }

        // Prepare references (optional, embedded in bill)
        const references = []
        if (data.references && data.references.length > 0) {
          data.references.forEach(ref => {
            // Only create reference if at least name OR phone number is provided
            if ((ref.name && ref.name.trim()) || (ref.number && ref.number.trim())) {
              references.push({
                name: ref.name?.trim() || '',
                phoneNumber: ref.number?.trim() || '',
                gender: ref.gender?.trim() || '', // Allow empty gender
                village: ref.village?.trim() || data.clientVillage || '',
                photo: ref.photo || '',
                aadhaarPhoto: ref.aadhaarPhoto || '',
                panPhoto: ref.panPhoto || '',
              })
            }
          })
        }

        // Prepare items data
        const processedItems = data.items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))

        // Create bill with embedded client details
        const billData = {
          clientDetails, // Embedded client details
          references, // Embedded references (optional)
          items: processedItems,
          subtotal,
          totalAmount,
          paidAmount: parseFloat(data.paidAmount) || 0,
          status: data.status === 'Unpaid' ? 'Sent' : data.status, // Map Unpaid back to Sent
          paymentDate: data.paymentDate,
        }

        console.log('Creating bill with JSON:', billData)

        if (isEdit) {
          const result = await updateBill({ id, ...billData }).unwrap()
          console.log('Bill updated:', result)
          toast.success('Bill updated successfully')
        } else {
          const result = await createBill(billData).unwrap()
          console.log('Bill created:', result)
          toast.success('Bill created successfully')
          
          // Generate and download PDF for new bills
          generatePDF(result.data, data)
        }
        
        navigate('/bills')
      }
    } catch (error) {
      console.error('Bill creation error:', error)
      toast.error(error?.data?.error?.message || error?.message || `Failed to ${isEdit ? 'update' : 'create'} bill`)
    }
  }

  const addItem = () => {
    prependItem({ itemType: 'select', itemId: '', itemName: '', quantity: 1, unitPrice: 0 })
  }

  const removeItemHandler = (index) => {
    if (itemFields.length > 1) {
      removeItem(index)
    }
  }

  // Handle item selection and auto-fill price
  const handleItemSelect = (index, itemId) => {
    const selectedItem = availableItems.find(item => item._id === itemId)
    if (selectedItem) {
      setValue(`items.${index}.itemId`, itemId)
      setValue(`items.${index}.itemName`, selectedItem.name)
      setValue(`items.${index}.unitPrice`, selectedItem.unitPrice)
    }
  }

  const addReference = () => {
    appendReference({ name: '', number: '', gender: '', village: watchedClientVillage || '' })
  }

  const removeReferenceHandler = (index) => {
    if (referenceFields.length > 1) {
      removeReference(index)
    }
  }

  // Show loading state when fetching bill data in edit mode
  if (isEdit && loadingBill) {
    console.log('🔄 Showing loading spinner - loadingBill:', loadingBill)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6">Loading bill data...</Typography>
        <Typography variant="body2" color="text.secondary">
          Bill ID: {id}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => {
            console.log('User chose to skip loading and create new bill')
            navigate('/bills/new')
          }}
          sx={{ mt: 2 }}
        >
          Skip Loading & Create New Bill
        </Button>
        <Button 
          variant="text" 
          onClick={() => navigate('/bills')}
          size="small"
        >
          Back to Bills
        </Button>
      </Box>
    )
  }

  console.log('📝 Rendering form - isEdit:', isEdit, 'loadingBill:', loadingBill, 'billData:', !!billData?.data)

  // Show error state if bill data failed to load
  if (isEdit && billError) {
    console.error('Bill fetch error:', billError)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load bill data: {billError?.data?.error?.message || billError?.message || 'Unknown error'}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bill ID: {id}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Error details: {JSON.stringify(billError, null, 2)}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/bills')}>
          Back to Bills
        </Button>
      </Box>
    )
  }

  // Show error if bill not found
  if (isEdit && billData && !billData.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Bill not found.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/bills')}>
          Back to Bills
        </Button>
      </Box>
    )
  }

  // Prevent editing paid bills
  if (isEdit && billData?.data && billData.data.status === 'Paid') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This bill has been marked as paid and cannot be edited. Paid bills are locked to maintain data integrity.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bill Number: {billData.data.billNumber}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Client: {billData.data.clientDetails?.clientName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Total Amount: ₹{billData.data.totalAmount?.toFixed(2)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/bills')}>
            Back to Bills
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/bills/${billData.data._id}/view`)}>
            View Bill
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 2,
        borderRadius: 0,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: 2
      }}>
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '48px' }}>
            <IconButton onClick={() => navigate('/bills')} size="small" sx={{ mr: 1.5, p: 0.5 }}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: '600', fontSize: '1.1rem' }}>
              {isEdit ? 'Edit Bill' : 'Create New Bill'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              {/* Bill Items Section - MOVED TO TOP */}
              <Accordion 
                expanded={!isMobile || activeStep === 0} 
                sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
              >
                <AccordionSummary 
                  expandIcon={isMobile ? <ExpandMore /> : null}
                  sx={{ 
                    bgcolor: 'success.light', 
                    color: 'success.contrastText',
                    borderRadius: '8px 8px 0 0',
                    minHeight: 56
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt />
                    <Typography variant="h6" fontWeight="bold">
                      Bill Items ({itemFields.length})
                    </Typography>
                    {itemFields.length > 0 && (
                      <CheckCircle color="success" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      📦 Items
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={addItem}
                      size="medium"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                        }
                      }}
                    >
                      Add Item
                    </Button>
                  </Box>

                  {/* Mobile Card View */}
                  {isMobile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {itemFields.map((field, index) => (
                        <Card key={field.id} variant="outlined" sx={{ 
                          bgcolor: 'grey.50',
                          border: '2px solid',
                          borderColor: 'primary.light',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white', 
                            p: 1.5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Item #{index + 1}
                            </Typography>
                            {itemFields.length > 1 && (
                              <IconButton
                                onClick={() => removeItemHandler(index)}
                                size="small"
                                sx={{ color: 'white' }}
                              >
                                <Delete />
                              </IconButton>
                            )}
                          </Box>
                          <CardContent sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Autocomplete
                                  freeSolo
                                  options={availableItems}
                                  getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option
                                    return `${option.name} - ₹${option.unitPrice}`
                                  }}
                                  value={watchedItems[index]?.itemName || ''}
                                  onChange={(event, newValue) => {
                                    if (typeof newValue === 'object' && newValue !== null) {
                                      // Selected existing item
                                      setValue(`items.${index}.itemType`, 'select')
                                      setValue(`items.${index}.itemId`, newValue._id)
                                      setValue(`items.${index}.itemName`, newValue.name)
                                      setValue(`items.${index}.unitPrice`, newValue.unitPrice)
                                    } else if (typeof newValue === 'string') {
                                      // Manual entry
                                      setValue(`items.${index}.itemType`, 'manual')
                                      setValue(`items.${index}.itemId`, '')
                                      setValue(`items.${index}.itemName`, newValue)
                                      setValue(`items.${index}.unitPrice`, 0)
                                    }
                                  }}
                                  onInputChange={(event, newInputValue) => {
                                    if (event?.type === 'change') {
                                      setValue(`items.${index}.itemName`, newInputValue)
                                    }
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Item Name"
                                      placeholder="Type to search or create new item..."
                                      error={!!errors.items?.[index]?.itemName}
                                      helperText={errors.items?.[index]?.itemName?.message || 'Select existing or type new item name'}
                                      InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                          <Receipt sx={{ color: 'primary.main', mr: 1 }} />
                                        ),
                                      }}
                                    />
                                  )}
                                  renderOption={(props, option) => (
                                    <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                      <Typography>{option.name}</Typography>
                                      <Chip label={`₹${option.unitPrice}`} size="small" color="primary" />
                                    </Box>
                                  )}
                                  loading={loadingItems}
                                  loadingText="Loading items..."
                                  noOptionsText="No items found. Type to create new."
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label="Quantity"
                                  type="number"
                                  {...register(`items.${index}.quantity`)}
                                  error={!!errors.items?.[index]?.quantity}
                                  helperText={errors.items?.[index]?.quantity?.message}
                                  InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>×</Typography>
                                  }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label="Unit Price"
                                  type="number"
                                  step="0.01"
                                  {...register(`items.${index}.unitPrice`)}
                                  error={!!errors.items?.[index]?.unitPrice}
                                  helperText={errors.items?.[index]?.unitPrice?.message}
                                  InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  p: 2,
                                  bgcolor: 'success.light',
                                  borderRadius: 1,
                                  border: '2px solid',
                                  borderColor: 'success.main'
                                }}>
                                  <Typography variant="body1" fontWeight="600" color="success.dark">
                                    Item Total:
                                  </Typography>
                                  <Typography variant="h6" color="success.dark" fontWeight="bold">
                                    ₹{((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    // Desktop Table View
                    <TableContainer component={Paper} variant="outlined" sx={{ 
                      border: '2px solid',
                      borderColor: 'primary.light',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ 
                            bgcolor: 'primary.main',
                          }}>
                            <TableCell width="40%" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>
                              Item Name
                            </TableCell>
                            <TableCell width="15%" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>
                              Quantity
                            </TableCell>
                            <TableCell width="20%" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>
                              Unit Price (₹)
                            </TableCell>
                            <TableCell width="15%" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>
                              Total (₹)
                            </TableCell>
                            <TableCell width="10%" sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', textAlign: 'center' }}>
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {itemFields.map((field, index) => (
                            <TableRow key={field.id} sx={{ 
                              '&:hover': { bgcolor: 'grey.50' },
                              bgcolor: index % 2 === 0 ? 'white' : 'grey.50'
                            }}>
                              <TableCell>
                                <Autocomplete
                                  freeSolo
                                  options={availableItems}
                                  getOptionLabel={(option) => {
                                    if (typeof option === 'string') return option
                                    return `${option.name} - ₹${option.unitPrice}`
                                  }}
                                  value={watchedItems[index]?.itemName || ''}
                                  onChange={(event, newValue) => {
                                    if (typeof newValue === 'object' && newValue !== null) {
                                      // Selected existing item
                                      setValue(`items.${index}.itemType`, 'select')
                                      setValue(`items.${index}.itemId`, newValue._id)
                                      setValue(`items.${index}.itemName`, newValue.name)
                                      setValue(`items.${index}.unitPrice`, newValue.unitPrice)
                                    } else if (typeof newValue === 'string') {
                                      // Manual entry
                                      setValue(`items.${index}.itemType`, 'manual')
                                      setValue(`items.${index}.itemId`, '')
                                      setValue(`items.${index}.itemName`, newValue)
                                    }
                                  }}
                                  onInputChange={(event, newInputValue) => {
                                    if (event?.type === 'change') {
                                      setValue(`items.${index}.itemName`, newInputValue)
                                    }
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      placeholder="Type to search or create..."
                                      error={!!errors.items?.[index]?.itemName}
                                      helperText={errors.items?.[index]?.itemName?.message}
                                      InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                          <Receipt sx={{ color: 'primary.main', mr: 0.5, fontSize: '1.2rem' }} />
                                        ),
                                      }}
                                    />
                                  )}
                                  renderOption={(props, option) => (
                                    <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                      <Typography>{option.name}</Typography>
                                      <Chip label={`₹${option.unitPrice}`} size="small" color="primary" />
                                    </Box>
                                  )}
                                  loading={loadingItems}
                                  loadingText="Loading..."
                                  noOptionsText="Type to create new item"
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  {...register(`items.${index}.quantity`)}
                                  error={!!errors.items?.[index]?.quantity}
                                  InputProps={{
                                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.9rem' }}>×</Typography>
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  step="0.01"
                                  {...register(`items.${index}.unitPrice`)}
                                  error={!!errors.items?.[index]?.unitPrice}
                                  InputProps={{
                                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.9rem' }}>₹</Typography>,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body1" fontWeight="bold" color="success.dark">
                                  ₹{((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {itemFields.length > 1 && (
                                  <IconButton
                                    color="error"
                                    onClick={() => removeItemHandler(index)}
                                    size="small"
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'error.light',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {isMobile && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setActiveStep(1)}
                        disabled={itemFields.length === 0}
                      >
                        Next: Client & References
                      </Button>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Client & Reference Details Section - COMBINED */}
              <Accordion 
                expanded={!isMobile || activeStep === 1} 
                sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}
              >
                <AccordionSummary 
                  expandIcon={isMobile ? <ExpandMore /> : null}
                  sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'primary.contrastText',
                    borderRadius: '8px 8px 0 0',
                    minHeight: 56
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    <Typography variant="h6" fontWeight="bold">
                      Client & References ({referenceFields.length} refs)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  {/* Client Details */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                      Client Details
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          {...register('clientName')}
                          error={!!errors.clientName}
                          helperText={errors.clientName?.message}
                          required
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          {...register('clientNumber')}
                          error={!!errors.clientNumber}
                          helperText={errors.clientNumber?.message}
                          required
                          size="small"
                          placeholder="9876543210"
                          InputProps={{
                            startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset" fullWidth>
                          <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>Gender</FormLabel>
                          <RadioGroup 
                            row 
                            value={watch('clientGender') || ''}
                            onChange={(e) => setValue('clientGender', e.target.value)}
                          >
                            <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                            <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                            <FormControlLabel value="Other" control={<Radio size="small" />} label="Other" />
                          </RadioGroup>
                          {errors.clientGender && (
                            <Typography variant="caption" color="error">
                              {errors.clientGender.message}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Village/City"
                          {...register('clientVillage')}
                          error={!!errors.clientVillage}
                          helperText={errors.clientVillage?.message}
                          required
                          size="small"
                          InputProps={{
                            startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Grid>
                      
                      {/* Photo Upload Fields */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                          Photo Documents (Optional)
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel shrink>
                            Photo
                          </InputLabel>
                          
                          {/* Show existing photo if available and no new photo selected */}
                          {(billData?.data?.clientDetails?.photo || existingPhotos.clientPhoto) && !imagePreviews.clientPhoto?.startsWith('blob:') && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                              <img 
                                src={existingPhotos.clientPhoto || `${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/photos/${billData.data.clientDetails.photo}`}
                                alt="Existing Client Photo" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  border: '2px solid #2196f3',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Typography variant="caption" color="primary.main" display="block">
                                📄 Existing Photo
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Show captured image preview */}
                          {imagePreviews.clientPhoto?.startsWith('blob:') && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                              <img 
                                src={imagePreviews.clientPhoto} 
                                alt="Client Photo Preview" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  border: '2px solid #4caf50',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Typography variant="caption" color="success.main" display="block">
                                ✅ Photo Captured
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Camera Capture Button */}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<CameraAlt />}
                              onClick={() => document.getElementById('client-photo-camera').click()}
                              size="small"
                              sx={{ flex: 1 }}
                            >
                              Capture Photo
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => document.getElementById('client-photo-file').click()}
                              size="small"
                              sx={{ flex: 1 }}
                            >
                              Choose File
                            </Button>
                          </Box>
                          
                          {/* Hidden camera input */}
                          <input
                            id="client-photo-camera"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect('clientPhoto', e.target.files[0])}
                          />
                          
                          {/* Hidden file input */}
                          <input
                            id="client-photo-file"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect('clientPhoto', e.target.files[0])}
                          />
                          
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Capture with camera or choose from gallery
                          </Typography>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel shrink>
                            Aadhaar Photo
                          </InputLabel>
                          
                          {/* Show existing aadhaar photo if available and no new photo selected */}
                          {(billData?.data?.clientDetails?.aadhaarPhoto || existingPhotos.clientAadhaar) && !imagePreviews.clientAadhaarPhoto?.startsWith('blob:') && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                              <img 
                                src={existingPhotos.clientAadhaar || `${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/aadhaar/${billData.data.clientDetails.aadhaarPhoto}`}
                                alt="Existing Client Aadhaar" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  border: '2px solid #2196f3',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Typography variant="caption" color="primary.main" display="block">
                                📄 Existing Aadhaar
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Show captured image preview */}
                          {imagePreviews.clientAadhaarPhoto?.startsWith('blob:') && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                              <img 
                                src={imagePreviews.clientAadhaarPhoto} 
                                alt="Aadhaar Photo Preview" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  border: '2px solid #4caf50',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Typography variant="caption" color="success.main" display="block">
                                ✅ Aadhaar Captured
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Camera Capture Button */}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<CameraAlt />}
                              onClick={() => document.getElementById('client-aadhaar-camera').click()}
                              size="small"
                              sx={{ flex: 1 }}
                            >
                              Capture Aadhaar
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => document.getElementById('client-aadhaar-file').click()}
                              size="small"
                              sx={{ flex: 1 }}
                            >
                              Choose File
                            </Button>
                          </Box>
                          
                          {/* Hidden camera input */}
                          <input
                            id="client-aadhaar-camera"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect('clientAadhaarPhoto', e.target.files[0])}
                          />
                          
                          {/* Hidden file input */}
                          <input
                            id="client-aadhaar-file"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect('clientAadhaarPhoto', e.target.files[0])}
                          />
                          
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Capture Aadhaar card with camera
                          </Typography>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel shrink>
                            PAN Photo
                          </InputLabel>
                          
                          {/* Show existing PAN photo if available and no new photo selected */}
                          {(billData?.data?.clientDetails?.panPhoto || existingPhotos.clientPan) && !imagePreviews.clientPanPhoto?.startsWith('blob:') && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                              <img 
                                src={existingPhotos.clientPan || `${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/pan/${billData.data.clientDetails.panPhoto}`}
                                alt="Existing Client PAN" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  border: '2px solid #2196f3',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Typography variant="caption" color="primary.main" display="block">
                                📄 Existing PAN
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Show captured image preview */}
                          {imagePreviews.clientPanPhoto?.startsWith('blob:') && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                              <img 
                                src={imagePreviews.clientPanPhoto} 
                                alt="PAN Photo Preview" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  border: '2px solid #4caf50',
                                  borderRadius: '8px'
                                }} 
                              />
                              <Typography variant="caption" color="success.main" display="block">
                                ✅ PAN Captured
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Camera Capture Button */}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<CameraAlt />}
                              onClick={() => document.getElementById('client-pan-camera').click()}
                              size="small"
                              sx={{ flex: 1 }}
                            >
                              Capture PAN
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => document.getElementById('client-pan-file').click()}
                              size="small"
                              sx={{ flex: 1 }}
                            >
                              Choose File
                            </Button>
                          </Box>
                          
                          {/* Hidden camera input */}
                          <input
                            id="client-pan-camera"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect('clientPanPhoto', e.target.files[0])}
                          />
                          
                          {/* Hidden file input */}
                          <input
                            id="client-pan-file"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect('clientPanPhoto', e.target.files[0])}
                          />
                          
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Capture PAN card with camera
                          </Typography>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* References Section - OPTIONAL */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" color="secondary.main" fontWeight="bold">
                        Reference Details ({referenceFields.length}) - Optional
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={addReference}
                        size="small"
                      >
                        Add Reference
                      </Button>
                    </Box>

                    {referenceFields.map((field, index) => (
                      <Card key={field.id} variant="outlined" sx={{ mb: 2, bgcolor: 'grey.50' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" color="secondary.main" fontWeight="bold">
                              Reference #{index + 1} (Optional)
                            </Typography>
                            <IconButton
                              color="error"
                              onClick={() => removeReferenceHandler(index)}
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Full Name (Optional)"
                                {...register(`references.${index}.name`)}
                                error={!!errors.references?.[index]?.name}
                                helperText={errors.references?.[index]?.name?.message}
                                size="small"
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Phone Number (Optional)"
                                {...register(`references.${index}.number`)}
                                error={!!errors.references?.[index]?.number}
                                helperText={errors.references?.[index]?.number?.message}
                                size="small"
                                placeholder="9876543210"
                                InputProps={{
                                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <FormControl component="fieldset" fullWidth>
                                <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>Gender (Optional)</FormLabel>
                                <RadioGroup 
                                  row 
                                  value={watchedReferences?.[index]?.gender || ''}
                                  onChange={(e) => setValue(`references.${index}.gender`, e.target.value)}
                                >
                                  <FormControlLabel value="Male" control={<Radio size="small" />} label="Male" />
                                  <FormControlLabel value="Female" control={<Radio size="small" />} label="Female" />
                                  <FormControlLabel value="Other" control={<Radio size="small" />} label="Other" />
                                </RadioGroup>
                                {errors.references?.[index]?.gender && (
                                  <Typography variant="caption" color="error">
                                    {errors.references[index].gender.message}
                                  </Typography>
                                )}
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Village/City (Optional)"
                                {...register(`references.${index}.village`)}
                                error={!!errors.references?.[index]?.village}
                                helperText={errors.references?.[index]?.village?.message || "Auto-filled from client village"}
                                size="small"
                                InputProps={{
                                  startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                              />
                            </Grid>
                            
                            {/* Photo Upload Fields for Reference */}
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, mb: 1, display: 'block' }}>
                                Photo Documents (Optional)
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth>
                                <InputLabel shrink>
                                  Photo
                                </InputLabel>
                                
                                {/* Show existing reference photo if available and no new photo selected */}
                                {watchedReferences?.[index]?.photo && !imagePreviews.references?.[`${index}_photo`]?.startsWith('blob:') && (
                                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/photos/${watchedReferences[index].photo}`}
                                      alt="Existing Reference Photo" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '120px', 
                                        border: '2px solid #2196f3',
                                        borderRadius: '8px'
                                      }} 
                                    />
                                    <Typography variant="caption" color="primary.main" display="block">
                                      📄 Existing Photo: {watchedReferences[index].photo}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Show captured image preview */}
                                {imagePreviews.references?.[`${index}_photo`]?.startsWith('blob:') && (
                                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <img 
                                      src={imagePreviews.references[`${index}_photo`]} 
                                      alt="Reference Photo Preview" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '120px', 
                                        border: '2px solid #4caf50',
                                        borderRadius: '8px'
                                      }} 
                                    />
                                    <Typography variant="caption" color="success.main" display="block">
                                      ✅ Photo Captured
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Camera Capture Button */}
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button
                                    variant="contained"
                                    startIcon={<CameraAlt />}
                                    onClick={() => document.getElementById(`reference-${index}-photo-camera`).click()}
                                    size="small"
                                    sx={{ flex: 1 }}
                                  >
                                    Capture
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    onClick={() => document.getElementById(`reference-${index}-photo-file`).click()}
                                    size="small"
                                    sx={{ flex: 1 }}
                                  >
                                    Choose
                                  </Button>
                                </Box>
                                
                                {/* Hidden camera input */}
                                <input
                                  id={`reference-${index}-photo-camera`}
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleFileSelect('photo', e.target.files[0], index)}
                                />
                                
                                {/* Hidden file input */}
                                <input
                                  id={`reference-${index}-photo-file`}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleFileSelect('photo', e.target.files[0], index)}
                                />
                                
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  Capture reference photo
                                </Typography>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth>
                                <InputLabel shrink>
                                  Aadhaar Photo
                                </InputLabel>
                                
                                {/* Show existing reference aadhaar photo if available and no new photo selected */}
                                {watchedReferences?.[index]?.aadhaarPhoto && !imagePreviews.references?.[`${index}_aadhaarPhoto`]?.startsWith('blob:') && (
                                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/aadhaar/${watchedReferences[index].aadhaarPhoto}`}
                                      alt="Existing Reference Aadhaar" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '120px', 
                                        border: '2px solid #2196f3',
                                        borderRadius: '8px'
                                      }} 
                                    />
                                    <Typography variant="caption" color="primary.main" display="block">
                                      📄 Existing Aadhaar: {watchedReferences[index].aadhaarPhoto}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Show captured image preview */}
                                {imagePreviews.references?.[`${index}_aadhaarPhoto`]?.startsWith('blob:') && (
                                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <img 
                                      src={imagePreviews.references[`${index}_aadhaarPhoto`]} 
                                      alt="Reference Aadhaar Preview" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '120px', 
                                        border: '2px solid #4caf50',
                                        borderRadius: '8px'
                                      }} 
                                    />
                                    <Typography variant="caption" color="success.main" display="block">
                                      ✅ Aadhaar Captured
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Camera Capture Button */}
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button
                                    variant="contained"
                                    startIcon={<CameraAlt />}
                                    onClick={() => document.getElementById(`reference-${index}-aadhaar-camera`).click()}
                                    size="small"
                                    sx={{ flex: 1 }}
                                  >
                                    Capture
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    onClick={() => document.getElementById(`reference-${index}-aadhaar-file`).click()}
                                    size="small"
                                    sx={{ flex: 1 }}
                                  >
                                    Choose
                                  </Button>
                                </Box>
                                
                                {/* Hidden camera input */}
                                <input
                                  id={`reference-${index}-aadhaar-camera`}
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleFileSelect('aadhaarPhoto', e.target.files[0], index)}
                                />
                                
                                {/* Hidden file input */}
                                <input
                                  id={`reference-${index}-aadhaar-file`}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleFileSelect('aadhaarPhoto', e.target.files[0], index)}
                                />
                                
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  Capture Aadhaar card
                                </Typography>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth>
                                <InputLabel shrink>
                                  PAN Photo
                                </InputLabel>
                                
                                {/* Show existing reference PAN photo if available and no new photo selected */}
                                {watchedReferences?.[index]?.panPhoto && !imagePreviews.references?.[`${index}_panPhoto`]?.startsWith('blob:') && (
                                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/pan/${watchedReferences[index].panPhoto}`}
                                      alt="Existing Reference PAN" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '120px', 
                                        border: '2px solid #2196f3',
                                        borderRadius: '8px'
                                      }} 
                                    />
                                    <Typography variant="caption" color="primary.main" display="block">
                                      📄 Existing PAN: {watchedReferences[index].panPhoto}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Show captured image preview */}
                                {imagePreviews.references?.[`${index}_panPhoto`]?.startsWith('blob:') && (
                                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <img 
                                      src={imagePreviews.references[`${index}_panPhoto`]} 
                                      alt="Reference PAN Preview" 
                                      style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '120px', 
                                        border: '2px solid #4caf50',
                                        borderRadius: '8px'
                                      }} 
                                    />
                                    <Typography variant="caption" color="success.main" display="block">
                                      ✅ PAN Captured
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* Camera Capture Button */}
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button
                                    variant="contained"
                                    startIcon={<CameraAlt />}
                                    onClick={() => document.getElementById(`reference-${index}-pan-camera`).click()}
                                    size="small"
                                    sx={{ flex: 1 }}
                                  >
                                    Capture
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    onClick={() => document.getElementById(`reference-${index}-pan-file`).click()}
                                    size="small"
                                    sx={{ flex: 1 }}
                                  >
                                    Choose
                                  </Button>
                                </Box>
                                
                                {/* Hidden camera input */}
                                <input
                                  id={`reference-${index}-pan-camera`}
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleFileSelect('panPhoto', e.target.files[0], index)}
                                />
                                
                                {/* Hidden file input */}
                                <input
                                  id={`reference-${index}-pan-file`}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleFileSelect('panPhoto', e.target.files[0], index)}
                                />
                                
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  Capture PAN card
                                </Typography>
                              </FormControl>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {isMobile && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setActiveStep(0)}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setActiveStep(2)}
                      >
                        Next: Summary
                      </Button>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Right Column - Bill Summary */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ 
                p: 3, 
                position: isMobile ? 'relative' : 'sticky', 
                top: isMobile ? 'auto' : 100, 
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: 3
              }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <Receipt />
                  Bill Summary
                </Typography>

                {/* Bill Calculation */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="bold">₹{subtotal.toFixed(2)}</Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    py: 2,
                    borderTop: '2px solid',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    mb: 3
                  }}>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">Total Amount:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                      ₹{totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Payment Amount Input */}
                <TextField
                  fullWidth
                  label="Payment Amount (₹)"
                  type="number"
                  step="0.01"
                  {...register('paidAmount')}
                  error={!!errors.paidAmount}
                  helperText={errors.paidAmount?.message || 'Enter the amount received from customer'}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 'bold' }}>₹</Typography>
                  }}
                  size="small"
                  sx={{ mb: 3 }}
                />

                {/* Auto-calculated Status Display */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Payment Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {watchedStatus === 'Paid' && (
                      <Chip 
                        label="Paid" 
                        color="success" 
                        size="medium"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                    {watchedStatus === 'Partial' && (
                      <Chip 
                        label="Partial Payment" 
                        color="warning" 
                        size="medium"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                    {watchedStatus === 'Unpaid' && (
                      <Chip 
                        label="Unpaid" 
                        color="error" 
                        size="medium"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      (Auto-calculated)
                    </Typography>
                  </Box>
                  
                  {/* Show payment details */}
                  {watchedPaidAmount > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Paid:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          ₹{parseFloat(watchedPaidAmount).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Due:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          ₹{(totalAmount - parseFloat(watchedPaidAmount)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Payment Date - Show if payment is made */}
                {(watchedStatus === 'Paid' || watchedStatus === 'Partial') && (
                  <TextField
                    fullWidth
                    label="Payment Date"
                    type="date"
                    {...register('paymentDate')}
                    error={!!errors.paymentDate}
                    helperText={errors.paymentDate?.message}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    size="small"
                    sx={{ mb: 3 }}
                  />
                )}

                <Divider sx={{ my: 2 }} />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={creating || updating ? <CircularProgress size={20} /> : <Save />}
                    disabled={creating || updating}
                    fullWidth
                    size="large"
                    sx={{ 
                      py: 1.5,
                      bgcolor: '#2e7d32',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                      '&:hover': {
                        bgcolor: '#1b5e20',
                        boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)',
                      },
                      '&:disabled': {
                        bgcolor: '#9e9e9e',
                        color: 'white',
                      }
                    }}
                  >
                    {creating || updating ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Bill' : 'Create Bill')}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => navigate('/bills')}
                    fullWidth
                    size="large"
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>
      </Box>

      {/* Mobile Navigation */}
      {isMobile && (
        <Paper sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: 2,
          borderRadius: '16px 16px 0 0',
          boxShadow: 3,
          zIndex: 1000
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Step {activeStep + 1} of 2
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Total: ₹{totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  )
  } catch (error) {
    console.error('BillFormPage Error:', error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          An error occurred while loading the bill form. Please refresh the page and try again.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Error: {error.message}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/bills')}>
          Back to Bills
        </Button>
      </Box>
    )
  }
}

export default BillFormPage