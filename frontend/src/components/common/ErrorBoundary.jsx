import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { ErrorOutline } from '@mui/icons-material'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
            }}
          >
            <ErrorOutline
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />
            <Typography variant="h5" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mr: 2 }}
            >
              Refresh Page
            </Button>
            <Button
              variant="outlined"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Try Again
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Error Details:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.8rem',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary