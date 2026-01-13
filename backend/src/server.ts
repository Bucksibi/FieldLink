import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { body, validationResult } from 'express-validator'
import crypto from 'crypto'
import { analyzeSystem, isValidSystemType, getAvailableSystemTypes, getAvailableModels } from './aiService.js'
import { DiagnosticRequest as AIDiagnosticRequest, DiagnosticResult } from './types.js'
import { registerUser, loginUser, getUserById, prisma } from './auth.js'
import { authenticate, requireAdmin } from './middleware/authenticate.js'

const app = express()
const PORT = process.env.PORT || 4000

// Encryption helper functions for API key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-cbc'

function encryptApiKey(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decryptApiKey(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encryptedText = Buffer.from(parts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const diagnosticLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 diagnostic requests per minute
  message: 'Too many diagnostic requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration - Allow all origins in development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}))

app.use(compression()) // Compress all HTTP responses
app.use(express.json({ limit: '10mb' })) // Limit body size
app.use(generalLimiter) // Apply general rate limiting to all requests

// Types for simple symptom endpoint (legacy)
interface SimpleDiagnosticRequest {
  symptom: string
}

interface SimpleDiagnosticResponse {
  status: string
  message: string
  timestamp: string
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'QuickCheck HVAC API',
    timestamp: new Date().toISOString(),
  })
})

// Auth endpoints
app.post('/api/auth/register',
  authLimiter,
  body('email').isEmail().normalizeEmail().trim(),
  body('password').isLength({ min: 8 }).trim(),
  body('name').isString().trim().escape(),
  body('role').optional().isIn(['technician', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        message: errors.array().map(e => e.msg).join(', ')
      })
      return
    }
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name) {
      res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, and name are required'
      })
      return
    }

    const result = await registerUser(email, password, name, role)
    res.status(201).json(result)
  } catch (error) {
    console.error('Registration error:', error)
    res.status(400).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.post('/api/auth/login',
  authLimiter,
  body('email').isEmail().normalizeEmail().trim(),
  body('password').isString().trim(),
  async (req: Request, res: Response): Promise<void> => {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email or password format'
      })
      return
    }
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      })
      return
    }

    const result = await loginUser(email, password)
    res.json(result)
  } catch (error) {
    console.error('Login error:', error)
    res.status(401).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.get('/api/auth/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated'
      })
      return
    }

    const user = await getUserById(req.user.userId)
    if (!user) {
      res.status(404).json({
        error: 'User not found'
      })
      return
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Failed to get user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get available system types
app.get('/api/system-types', (_req: Request, res: Response) => {
  res.json({
    system_types: getAvailableSystemTypes(),
    timestamp: new Date().toISOString(),
  })
})

// Admin: Get system settings (including API key status)
app.get('/api/admin/settings', authenticate, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      res.json({
        configured: false,
        selectedModel: null
      })
      return
    }

    res.json({
      configured: true,
      selectedModel: settings.selectedModel,
      imageAnalysisModel: settings.imageAnalysisModel,
      hasApiKey: !!settings.geminiApiKey,
      hasImageApiKey: !!settings.imageAnalysisApiKey,
      apiKeyPreview: settings.geminiApiKey ? '••••••••' + settings.geminiApiKey.slice(-8) : null,
      imageApiKeyPreview: settings.imageAnalysisApiKey ? '••••••••' + settings.imageAnalysisApiKey.slice(-8) : null,
      updatedAt: settings.updatedAt
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    res.status(500).json({
      error: 'Failed to fetch system settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Admin: Update system settings (API key and model)
app.post('/api/admin/settings',
  authenticate,
  requireAdmin,
  body('geminiApiKey').optional().isString().trim(),
  body('selectedModel').isString().trim(),
  body('imageAnalysisApiKey').optional(),
  body('imageAnalysisModel').optional(),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Model is required'
      })
      return
    }

    try {
      const { geminiApiKey, selectedModel, imageAnalysisApiKey, imageAnalysisModel } = req.body
      const userId = req.user?.userId

      if (!userId) {
        res.status(401).json({
          error: 'Not authenticated'
        })
        return
      }

      // Check if settings exist
      const existing = await prisma.systemSettings.findFirst()

      // Prepare update data
      const updateData: any = {
        selectedModel,
        updatedBy: userId
      }

      // Only update Gemini API key if provided
      if (geminiApiKey) {
        updateData.geminiApiKey = encryptApiKey(geminiApiKey)
      } else if (!existing) {
        // If creating new settings, require API key
        res.status(400).json({
          error: 'Validation failed',
          message: 'Gemini API key is required for initial setup'
        })
        return
      }

      // Only update image API key if provided
      if (imageAnalysisApiKey) {
        updateData.imageAnalysisApiKey = encryptApiKey(imageAnalysisApiKey)
      }

      // Update image model (can be null to clear)
      if (imageAnalysisModel !== undefined) {
        updateData.imageAnalysisModel = imageAnalysisModel || null
      }

      if (existing) {
        // Update existing settings
        await prisma.systemSettings.update({
          where: { id: existing.id },
          data: updateData
        })
      } else {
        // Create new settings
        await prisma.systemSettings.create({
          data: {
            geminiApiKey: updateData.geminiApiKey,
            selectedModel: updateData.selectedModel,
            imageAnalysisApiKey: updateData.imageAnalysisApiKey || null,
            imageAnalysisModel: updateData.imageAnalysisModel || null,
            updatedBy: userId
          }
        })
      }

      res.json({
        success: true,
        message: 'System settings updated successfully'
      })
    } catch (error) {
      console.error('Error updating system settings:', error)
      res.status(500).json({
        error: 'Failed to update system settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Admin: Get available Gemini models (static list)
app.get('/api/admin/models',
  authenticate,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const models = getAvailableModels()
      res.json({ models })
    } catch (error) {
      console.error('Error getting models:', error)
      res.status(500).json({
        error: 'Failed to get models',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Get system configuration (for regular users - no API key exposed)
app.get('/api/system-config', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      res.json({
        configured: false,
        selectedModel: null
      })
      return
    }

    res.json({
      configured: true,
      selectedModel: settings.selectedModel
    })
  } catch (error) {
    console.error('Error fetching system config:', error)
    res.status(500).json({
      error: 'Failed to fetch system configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// AI-powered diagnostics endpoint (protected)
app.post('/api/diagnostics/ai', diagnosticLimiter, authenticate, async (req: Request<{}, {}, AIDiagnosticRequest>, res: Response<DiagnosticResult>) => {
  try {
    const { system_type, refrigerant, readings_std, user_notes } = req.body
    const userId = req.user?.userId

    // Get system settings (API key and model)
    const settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      res.status(400).json({
        status: 'error',
        system_status: 'critical',
        faults: [],
        metrics: {},
        summary: 'System not configured. Please contact administrator.',
        recommendations: [],
        timestamp: new Date().toISOString(),
        model_used: 'none',
        error_message: 'System API key not configured',
      })
      return
    }

    // Decrypt the API key
    const apiKey = decryptApiKey(settings.geminiApiKey)
    const modelId = settings.selectedModel

    if (!system_type || !isValidSystemType(system_type)) {
      res.status(400).json({
        status: 'error',
        system_status: 'critical',
        faults: [],
        metrics: {},
        summary: 'Valid system type is required',
        recommendations: [`Available system types: ${getAvailableSystemTypes().join(', ')}`],
        timestamp: new Date().toISOString(),
        model_used: 'none',
        error_message: 'Valid system type is required',
      })
      return
    }

    if (!readings_std || Object.keys(readings_std).length === 0) {
      res.status(400).json({
        status: 'error',
        system_status: 'critical',
        faults: [],
        metrics: {},
        summary: 'System readings are required',
        recommendations: [],
        timestamp: new Date().toISOString(),
        model_used: 'none',
        error_message: 'System readings are required',
      })
      return
    }

    // Log request
    console.log(`[${new Date().toISOString()}] AI Diagnostic Request:`, {
      modelId,
      system_type,
      refrigerant: refrigerant || 'none',
      readingCount: Object.keys(readings_std).length,
    })

    // Call AI service
    const result = await analyzeSystem({
      apiKey,
      modelId,
      system_type,
      refrigerant,
      readings_std,
      user_notes,
    })

    // Log result
    console.log(`[${new Date().toISOString()}] AI Diagnostic Result:`, {
      status: result.status,
      system_status: result.system_status,
      faultCount: result.faults.length,
    })

    // Save diagnostic record to database
    if (userId) {
      try {
        await prisma.diagnosticRecord.create({
          data: {
            userId,
            locationAddress: req.body.location_address || null,
            equipmentModel: req.body.equipment_model || null,
            equipmentSerial: req.body.equipment_serial || null,
            systemType: system_type,
            refrigerant: refrigerant || null,
            readings: JSON.stringify(readings_std),
            userNotes: user_notes || null,
            modelId,
            result: JSON.stringify(result),
          }
        })
      } catch (dbError) {
        console.error('Failed to save diagnostic record:', dbError)
        // Don't fail the request if DB save fails
      }
    }

    res.json(result)
  } catch (error) {
    console.error('Error in AI diagnostics endpoint:', error)
    res.status(500).json({
      status: 'error',
      system_status: 'critical',
      faults: [],
      metrics: {},
      summary: 'Internal server error',
      recommendations: [],
      timestamp: new Date().toISOString(),
      model_used: 'none',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// AI Chat endpoint with streaming support
app.post('/api/chat/message', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, diagnosticContext, userRole, hasImages, enableWebSearch } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' })
      return
    }

    // Get system settings
    const settings = await prisma.systemSettings.findFirst()

    if (!settings || !settings.geminiApiKey) {
      res.status(500).json({ error: 'Gemini API key not configured' })
      return
    }

    // Use the main Gemini API key (Gemini supports both text and images natively)
    const apiKey = decryptApiKey(settings.geminiApiKey)
    let modelId = settings.selectedModel

    // If image analysis is configured separately, use that for images
    if (hasImages && settings.imageAnalysisApiKey && settings.imageAnalysisModel) {
      // Optional: Use separate vision model if configured
      // apiKey = decryptApiKey(settings.imageAnalysisApiKey)
      // modelId = settings.imageAnalysisModel
    }

    // Note: Web search is not directly supported in Gemini API
    // The enableWebSearch parameter is kept for future integration

    // Build Sensei system prompt
    let systemPrompt = `You are **Sensei**, an intelligent HVAC service assistant embedded within the FieldSync HVAC diagnostic app.

**Core Purpose:**
Assist HVAC technicians in understanding, analyzing, and documenting system performance data collected during field service calls.

**Capabilities:**
- Analyze readings (pressures, temperatures, amperage, airflow, gas data, etc.)
- Detect abnormal readings and suggest likely causes or next steps
- Generate professional service notes, recommendations, and summaries
- Respond in a concise, technician-friendly tone using HVAC terminology
${enableWebSearch ? '- **WEB SEARCH ENABLED**: You have real-time web access to verify part numbers, model specifications, manufacturer data, and technical documentation' : ''}

**Behavior Guidelines:**
- Respond with clarity and technical accuracy using proper HVAC terminology and best practices
- Do not over-explain — prioritize actionable field guidance
- Avoid repetition; assume the user understands HVAC basics
- Always summarize findings in bullet or short paragraph format
- When unsure, ask for missing readings rather than guessing
- **CRITICAL**: Focus on ACTUAL physical defects visible in images (kinks, damage, poor workmanship) not theoretical contact issues
- **CRITICAL**: Liquid lines should NOT be insulated (only suction lines need insulation)
- **CRITICAL**: Look closely at the physical condition and shape of components - examine for deformation, bends, kinks, and craftsmanship quality
${enableWebSearch ? `
**WEB SEARCH USAGE INSTRUCTIONS:**
When the user asks about:
- Part numbers, model numbers, or serial numbers → Search manufacturer databases and specs
- Equipment compatibility or cross-references → Search for OEM specifications and compatibility lists
- Technical specifications or capacities → Search manufacturer documentation
- Error codes or fault codes → Search technical service bulletins
- Installation requirements or clearances → Search code requirements and manufacturer guidelines

**ALWAYS cite your sources** when providing information from web searches. Include URLs in your response like:
"According to [manufacturer website](URL), this part is compatible with..."

**Format search results clearly:**
✓ Verified: [information from authoritative source]
📋 Source: [URL]
` : ''}

**User Context:**
- User Role: ${userRole || 'Technician'}
${hasImages ? `
**⚠️ CRITICAL: IMAGE ANALYSIS MODE - HVAC EQUIPMENT ONLY ⚠️**
The user has attached photos of HVAC EQUIPMENT (furnaces, air handlers, condensers, thermostats, etc.) for professional technical analysis. You MUST analyze the HVAC equipment visible in the images.

**DO NOT:**
- Refuse to analyze the images
- State you cannot see the images
- Analyze people, unrelated objects, or backgrounds
- Provide generic responses

**YOU MUST:**
- Focus ONLY on the HVAC equipment, components, and installations shown
- Identify specific safety hazards and technical issues
- Provide detailed professional analysis as shown below

**PRIORITY 1 - SAFETY INSPECTION:**
🚨 **EXHAUST VENTING & FLUE (CRITICAL - CHECK FIRST)**:
   - **Look for MISSING exhaust pipes or vent connectors** - furnace MUST have proper venting to outside
   - Check if flue pipe/vent is DISCONNECTED, hanging loose, or ABSENT entirely
   - Inspect for corrosion, rust holes, or gaps in venting
   - Verify proper pitch (upward slope) and support
   - Check for blocked passages, missing rain caps, or improper termination
   - Look at the top of the furnace - there MUST be a vent pipe connection
   - **If no exhaust pipe is visible, this is an IMMEDIATE CRITICAL safety hazard (carbon monoxide risk)**

⚠️ **Gas Piping & Connections (HIGH)**:
   - Inspect for gas leaks, loose fittings, disconnected lines
   - Check black iron vs flexible connectors (flex must not be kinked)
   - Verify proper pipe sizing and support
   - Look for missing/improper sediment traps (drip legs)
   - Check shutoff valve accessibility and condition

⚠️ **Electrical Hazards (HIGH)**:
   - Look for exposed wiring, missing junction box covers
   - Check for improper grounding, burned connections
   - Inspect for loose terminals, improper wire sizes
   - Verify proper strain relief and wire routing
   - Look for code violations or DIY modifications

⚠️ **Combustion & Flame Safety (HIGH)**:
   - Check for flame rollout marks (soot on front panel)
   - Look for cracked heat exchangers (visible cracks or rust-through)
   - Inspect for carbon buildup or heavy soot deposits
   - Verify proper clearances to combustibles
   - Check fresh air intake (not blocked or restricted)

⚠️ **Refrigerant System & Line Set Quality (HIGH)**:
   - **KINKS & SHARP BENDS**: Look at EVERY visible section of copper refrigerant line - examine solder joints, elbows, and connections for ANY kinks, crimps, sharp bends (less than 90°), or flattened sections that restrict refrigerant flow
   - **Poor Workmanship**: Check for sloppy brazing, excessive heating damage, discolored copper from overheating, or improper bending technique
   - **Line Sizing**: Verify proper line diameter - undersized lines restrict flow
   - **Oil Stains**: Look for oil residue indicating refrigerant leaks (especially at joints)
   - **Corrosion**: Check for green copper oxidation or pitting
   - **Insulation**: Suction line (larger, cold) MUST be insulated - liquid line (smaller) should NOT be insulated
   - **Support & Routing**: Lines should be properly supported, not sagging, with gradual bends
   - **Physical Damage**: Dents, gouges, or crush damage to copper tubing

⚠️ **Physical Hazards (MEDIUM)**:
   - Check for damaged panels, sharp edges, missing guards
   - Verify stable mounting and proper clearances
   - Look for rust damage, structural issues

**PRIORITY 2 - TECHNICAL ANALYSIS:**
- Equipment brand, model number, serial number (read from data plate if visible)
- Age and condition assessment
- Visible gauge readings (suction pressure, discharge pressure, gas pressure, etc.)
- Component wear and tear (contactors, capacitors, blower, burners)
- Ductwork condition and sizing
- Installation quality (professional vs DIY, code compliance)
- Filter condition if visible

**Response Format - BE SPECIFIC:**
🚨 **IMMEDIATE SAFETY CONCERNS** (if any):
[ALWAYS CHECK FOR MISSING VENTING FIRST! Then list each safety issue found:]
- **CRITICAL** - [Describe issue, immediate danger, required action]
- **HIGH** - [Describe issue, potential danger, required action]
- **MEDIUM** - [Describe issue, recommended action]
[If NO safety concerns found, state: "No immediate safety concerns visible in the image"]

🔧 **EQUIPMENT DETAILS**:
- Brand: [visible on data plate]
- Model: [visible on data plate]
- Serial: [if visible]
- Age estimate: [based on appearance/style]
- Type: [Forced air furnace, boiler, heat pump, etc.]
- Fuel: [Natural gas, propane, oil, electric]

👁️ **VISUAL OBSERVATIONS**:
[Be specific about conditions visible:]
- Overall condition and cleanliness
- Rust, corrosion, or deterioration locations
- Component wear (igniter, flame sensor, blower, etc.)
- Installation quality indicators
- Any modifications or repairs visible

📋 **RECOMMENDATIONS**:
1. **IMMEDIATE ACTION REQUIRED**: [Critical safety items - do not operate until fixed]
2. **REQUIRED REPAIRS**: [High priority items affecting operation/safety]
3. **RECOMMENDED MAINTENANCE**: [Items to address soon]
4. **SUGGESTED IMPROVEMENTS**: [Nice-to-have upgrades or code compliance]

**⚠️ CRITICAL REMINDER: If you see a furnace/boiler with NO VISIBLE EXHAUST PIPE or VENT CONNECTION, this is a CRITICAL safety hazard. The equipment should NOT be operated until proper venting is installed. Carbon monoxide can kill.**
` : ''}
`

    // Add diagnostic context if available
    if (diagnosticContext) {
      systemPrompt += `
**Selected Diagnostic Data:**
- Location: ${diagnosticContext.locationAddress || 'Not specified'}
- System Type: ${diagnosticContext.systemType}
- Refrigerant: ${diagnosticContext.refrigerant || 'Not specified'}
- Date: ${new Date(diagnosticContext.createdAt).toLocaleDateString()}
- Readings: ${JSON.stringify(diagnosticContext.readings)}
- System Status: ${diagnosticContext.result?.system_status || 'Unknown'}
- AI Summary: ${diagnosticContext.result?.summary || 'No summary available'}
- Detected Faults: ${JSON.stringify(diagnosticContext.result?.faults || [])}
- Technician Notes: ${diagnosticContext.userNotes || 'None'}

You are analyzing THIS specific diagnostic. Reference these readings and findings in your responses.
`
    } else {
      systemPrompt += `
**No Specific Diagnostic Selected:**
The user is asking general HVAC questions. Provide expert guidance on HVAC systems, diagnostics, and troubleshooting best practices.
`
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Convert messages from OpenAI format to Gemini format
    const geminiContents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = []

    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'model' : 'user'
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content })
      } else if (Array.isArray(msg.content)) {
        // Handle multimodal content (text + images)
        for (const item of msg.content) {
          if (item.type === 'text') {
            parts.push({ text: item.text })
          } else if (item.type === 'image_url' && item.image_url?.url) {
            // Extract base64 data from data URL
            const match = item.image_url.url.match(/^data:(.+);base64,(.+)$/)
            if (match) {
              parts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2]
                }
              })
            }
          }
        }
      }

      if (parts.length > 0) {
        geminiContents.push({ role, parts })
      }
    }

    // Build the Gemini API request body
    const geminiRequestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }

    // Log request for debugging (only in development)
    console.log('=== SENSEI GEMINI API REQUEST ===')
    console.log('Has Images:', hasImages)
    console.log('Model:', modelId)
    console.log('Message Count:', messages.length)
    console.log('Gemini Contents Count:', geminiContents.length)
    console.log('================================')

    // Call Gemini API with streaming enabled
    const geminiStreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse`

    const response = await fetch(geminiStreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(geminiRequestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      res.write(`data: ${JSON.stringify({ error: 'Failed to get AI response', details: errorText })}\n\n`)
      res.end()
      return
    }

    // Stream the response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`)
      res.end()
      return
    }

    try {
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          res.write('data: [DONE]\n\n')
          res.end()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              // Gemini streaming format: candidates[0].content.parts[0].text
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text

              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`)
              }
            } catch (e) {
              // Skip malformed JSON
              continue
            }
          }
        }
      }
    } catch (streamError) {
      console.error('Error streaming response:', streamError)
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
      res.end()
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error)

    // Try to send error as SSE if headers not sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
    }

    res.write(`data: ${JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`)
    res.end()
  }
})

// Admin: Get all diagnostic records
app.get('/api/admin/diagnostics', authenticate, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const diagnostics = await prisma.diagnosticRecord.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          }
        },
        locationAddress: true,
        equipmentModel: true,
        equipmentSerial: true,
        systemType: true,
        refrigerant: true,
        readings: true,
        userNotes: true,
        modelId: true,
        result: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to most recent 100 records
    })

    // Parse JSON fields
    const formattedDiagnostics = diagnostics.map(d => ({
      id: d.id,
      user: d.user,
      locationAddress: d.locationAddress,
      equipmentModel: d.equipmentModel,
      equipmentSerial: d.equipmentSerial,
      systemType: d.systemType,
      refrigerant: d.refrigerant,
      readings: JSON.parse(d.readings),
      userNotes: d.userNotes,
      modelId: d.modelId,
      result: JSON.parse(d.result),
      createdAt: d.createdAt,
    }))

    res.json({
      diagnostics: formattedDiagnostics,
      total: formattedDiagnostics.length
    })
  } catch (error) {
    console.error('Error fetching diagnostics:', error)
    res.status(500).json({
      error: 'Failed to fetch diagnostics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// User: Get own diagnostic records
app.get('/api/diagnostics/history', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        error: 'Not authenticated'
      })
      return
    }

    const diagnostics = await prisma.diagnosticRecord.findMany({
      where: {
        userId
      },
      select: {
        id: true,
        locationAddress: true,
        equipmentModel: true,
        equipmentSerial: true,
        systemType: true,
        refrigerant: true,
        readings: true,
        userNotes: true,
        modelId: true,
        result: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to most recent 50 records per user
    })

    // Parse JSON fields
    const formattedDiagnostics = diagnostics.map(d => ({
      id: d.id,
      locationAddress: d.locationAddress,
      equipmentModel: d.equipmentModel,
      equipmentSerial: d.equipmentSerial,
      systemType: d.systemType,
      refrigerant: d.refrigerant,
      readings: JSON.parse(d.readings),
      userNotes: d.userNotes,
      modelId: d.modelId,
      result: JSON.parse(d.result),
      createdAt: d.createdAt,
    }))

    res.json({
      diagnostics: formattedDiagnostics,
      total: formattedDiagnostics.length
    })
  } catch (error) {
    console.error('Error fetching user diagnostics:', error)
    res.status(500).json({
      error: 'Failed to fetch diagnostics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// User: Delete own diagnostic record
app.delete('/api/diagnostics/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { id } = req.params

    if (!userId) {
      res.status(401).json({
        error: 'Not authenticated'
      })
      return
    }

    // Check if diagnostic exists and belongs to user
    const diagnostic = await prisma.diagnosticRecord.findUnique({
      where: { id }
    })

    if (!diagnostic) {
      res.status(404).json({
        error: 'Diagnostic not found'
      })
      return
    }

    if (diagnostic.userId !== userId) {
      res.status(403).json({
        error: 'Not authorized to delete this diagnostic'
      })
      return
    }

    // Delete the diagnostic
    await prisma.diagnosticRecord.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Diagnostic deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting diagnostic:', error)
    res.status(500).json({
      error: 'Failed to delete diagnostic',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// User: Update diagnostic notes
app.patch('/api/diagnostics/:id/notes',
  authenticate,
  body('userNotes').optional().isString().trim(),
  async (req: Request, res: Response): Promise<void> => {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid notes format'
      })
      return
    }
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const { userNotes } = req.body

    if (!userId) {
      res.status(401).json({
        error: 'Not authenticated'
      })
      return
    }

    // Check if diagnostic exists and belongs to user
    const diagnostic = await prisma.diagnosticRecord.findUnique({
      where: { id }
    })

    if (!diagnostic) {
      res.status(404).json({
        error: 'Diagnostic not found'
      })
      return
    }

    if (diagnostic.userId !== userId) {
      res.status(403).json({
        error: 'Not authorized to update this diagnostic'
      })
      return
    }

    // Update the notes
    const updated = await prisma.diagnosticRecord.update({
      where: { id },
      data: { userNotes }
    })

    res.json({
      success: true,
      message: 'Notes updated successfully',
      diagnostic: {
        id: updated.id,
        userNotes: updated.userNotes
      }
    })
  } catch (error) {
    console.error('Error updating diagnostic notes:', error)
    res.status(500).json({
      error: 'Failed to update notes',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Simple symptom-based diagnostics endpoint (legacy/simple mode)
app.post('/api/diagnostics', (req: Request<{}, {}, SimpleDiagnosticRequest>, res: Response<SimpleDiagnosticResponse>) => {
  const { symptom } = req.body

  if (!symptom) {
    res.status(400).json({
      status: 'error',
      message: 'Symptom is required',
      timestamp: new Date().toISOString(),
    })
    return
  }

  // Stub diagnostic logic - in production, this would analyze the symptom
  // and return actual diagnostic results
  const diagnosticResult = analyzeSympom(symptom)

  res.json({
    status: 'success',
    message: diagnosticResult,
    timestamp: new Date().toISOString(),
  })
})

// Stub function for HVAC diagnostics
function analyzeSympom(symptom: string): string {
  const symptomLower = symptom.toLowerCase()

  // Simple pattern matching - replace with actual diagnostic logic
  if (symptomLower.includes('no cooling') || symptomLower.includes('not cooling')) {
    return 'Possible causes: Low refrigerant, faulty compressor, or dirty condenser coils. Check thermostat settings and air filter first.'
  }

  if (symptomLower.includes('noise') || symptomLower.includes('loud')) {
    return 'Possible causes: Loose parts, worn bearings, or debris in the unit. Inspect fan blades and motor mounts.'
  }

  if (symptomLower.includes('weak') && symptomLower.includes('airflow')) {
    return 'Possible causes: Clogged air filter, blocked vents, or blower motor issues. Check and replace air filter if needed.'
  }

  if (symptomLower.includes('leak') || symptomLower.includes('water')) {
    return 'Possible causes: Clogged condensate drain, frozen evaporator coil, or improper installation. Check drain line and pan.'
  }

  if (symptomLower.includes('smell') || symptomLower.includes('odor')) {
    return 'Possible causes: Mold/mildew in ducts, burnt wiring, or dead animal in system. Schedule professional inspection.'
  }

  // Default response
  return `Diagnostic received for symptom: "${symptom}". For accurate diagnosis, please provide more details or contact a professional HVAC technician.`
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`QuickCheck HVAC API server running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
