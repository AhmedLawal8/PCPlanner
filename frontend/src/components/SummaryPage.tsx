import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { AIOverview } from './AIOverview'
import { USE_CASE_OPTIONS } from '../constants/quizOptions'
import type { GenerateResponse, PartOption, PartTier } from '../constants/parts'
import { api, ApiError } from '../services/api'

const ORANGE = '#C85A1A'

const CATEGORY_ORDER = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler']

const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  motherboard: 'Motherboard',
  ram: 'RAM',
  storage: 'Storage',
  psu: 'PSU',
  case: 'Case',
  cooler: 'Cooler',
}

const TIER_LABELS: Record<PartTier, string> = {
  budget: 'Budget',
  best_value: 'Best Value',
  recommend: 'Recommend',
  performance: 'Performance',
}

const TIER_COLORS: Record<PartTier, string> = {
  budget: 'gray',
  best_value: 'blue',
  recommend: 'brandOrange',
  performance: 'violet',
}

// ── Component detail field configs ────────────────────────────────────────────

interface FieldConfig {
  key: string
  label: string
  format?: (val: unknown) => string
}

const COMPONENT_FIELDS: Record<string, FieldConfig[]> = {
  cpu: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'cores', label: 'Cores' },
    { key: 'base_clock', label: 'Base Clock', format: (v) => `${v} GHz` },
    { key: 'boost_clock', label: 'Boost Clock', format: (v) => `${v} GHz` },
    { key: 'wattage', label: 'TDP', format: (v) => `${v}W` },
    { key: 'socket', label: 'Socket' },
  ],
  motherboard: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'socket', label: 'Socket' },
    { key: 'type', label: 'Type' },
    { key: 'memory_type', label: 'Memory Type' },
    { key: 'max_memory', label: 'Max Memory', format: (v) => `${v} GB` },
  ],
  gpu: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'vram', label: 'VRAM', format: (v) => `${v} GB` },
    { key: 'wattage', label: 'TDP', format: (v) => `${v}W` },
    { key: 'chipset', label: 'Chipset' },
  ],
  ram: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'capacity', label: 'Capacity', format: (v) => `${v} GB` },
    { key: 'speed', label: 'Speed', format: (v) => `${v} MHz` },
    { key: 'memory_type', label: 'Memory Type' },
  ],
  storage: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'capacity', label: 'Capacity', format: (v) => `${v} GB` },
    { key: 'drive_type', label: 'Drive Type' },
    { key: 'interface', label: 'Interface' },
  ],
  psu: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'wattage', label: 'Wattage', format: (v) => `${v}W` },
    { key: 'efficiency_rating', label: 'Efficiency' },
  ],
  case: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'case_type', label: 'Type' },
    { key: 'color', label: 'Color' },
  ],
  cooler: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'rpm', label: 'Fan Speed', format: (v) => `${v} RPM` },
    { key: 'noise_level', label: 'Noise', format: (v) => `${v} dB` },
    { key: 'radiator_size', label: 'Radiator', format: (v) => `${v} mm` },
  ],
}

interface ComponentDetail {
  id: number
  name: string
  price: number
  [key: string]: unknown
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box
      p="sm"
      style={{
        borderRadius: 8,
        border: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      <Text size="xs" c="dimmed" mb={2}>
        {label}
      </Text>
      <Text size="sm" fw={600}>
        {value}
      </Text>
    </Box>
  )
}

// ── Part card ─────────────────────────────────────────────────────────────────

interface SummaryLocationState {
  response: GenerateResponse
  budget: number
  useCase: string
}

interface PartRowProps {
  option: PartOption
  isSelected: boolean
  isDetailOpen: boolean
  onSelect: () => void
  onDetails: () => void
}

function PartRow({ option, isSelected, isDetailOpen, onSelect, onDetails }: PartRowProps) {
  return (
    <UnstyledButton
      onClick={onSelect}
      w="100%"
      style={{
        borderRadius: 8,
        border: isSelected
          ? `1.5px solid ${ORANGE}`
          : '1px solid var(--mantine-color-gray-3)',
        backgroundColor: isSelected ? 'var(--mantine-color-brandOrange-0)' : 'transparent',
        padding: '10px 12px',
        transition: 'border-color 0.12s, background-color 0.12s',
      }}
    >
      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap">
          <Badge size="xs" color={TIER_COLORS[option.tier]} variant="light">
            {TIER_LABELS[option.tier]}
          </Badge>
          {isSelected && <IconCheck size={13} color={ORANGE} />}
        </Group>
        <Text size="sm" fw={isSelected ? 600 : 400} lineClamp={2} lh={1.4}>
          {option.name}
        </Text>
        <Group justify="space-between" align="center">
          <Text size="sm" fw={700} c="brandOrange">
            ${option.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text
            size="xs"
            c={isDetailOpen ? 'brandOrange' : 'dimmed'}
            fw={isDetailOpen ? 600 : 400}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={(e) => {
              e.stopPropagation()
              onDetails()
            }}
          >
            {isDetailOpen ? 'Hide' : 'Details'}
          </Text>
        </Group>
      </Stack>
    </UnstyledButton>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SummaryPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const locationState = state as SummaryLocationState | null

  const partGroups = locationState
    ? CATEGORY_ORDER.filter((cat) => locationState.response.parts[cat]).map((cat) => ({
        category: cat,
        options: locationState.response.parts[cat],
      }))
    : []

  const [selectedParts, setSelectedParts] = useState<Record<string, PartOption>>(() => {
    if (!locationState) return {}
    const initial: Record<string, PartOption> = {}
    for (const group of partGroups) {
      const pick = group.options.find((o) => o.tier === 'recommend') ?? group.options[0]
      if (pick) initial[group.category] = pick
    }
    return initial
  })

  // Save state
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [buildName, setBuildName] = useState('My Build')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  // Inline detail state — one panel open at a time, keyed by "category/id"
  const [detailKey, setDetailKey] = useState<{ cat: string; id: number } | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, ComponentDetail>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  if (!locationState) return <Navigate to="/quiz" replace />

  const { response, budget, useCase } = locationState
  const useCaseLabel = USE_CASE_OPTIONS.find((o) => o.value === useCase)?.label ?? useCase
  const runningTotal = Object.values(selectedParts).reduce((sum, p) => sum + p.price, 0)
  const budgetPercent = Math.min(100, Math.round((runningTotal / budget) * 100))
  const isOverBudget = runningTotal > budget

  // setWarnings wired up in Phase 6 (PATCH response)
  void setWarnings

  const handleDetails = async (category: string, id: number) => {
    // Toggle off if same card
    if (detailKey?.cat === category && detailKey?.id === id) {
      setDetailKey(null)
      return
    }

    setDetailKey({ cat: category, id })

    const cacheKey = `${category}/${id}`
    if (detailCache[cacheKey]) return

    setLoadingKey(cacheKey)
    try {
      const data = await api.get<ComponentDetail>(`/api/components/${category}/${id}`)
      setDetailCache((prev) => ({ ...prev, [cacheKey]: data }))
    } catch {
      // leave cache absent; panel shows error state
    } finally {
      setLoadingKey(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const parts: Record<string, { id: number }> = {}
      for (const [cat, part] of Object.entries(selectedParts)) {
        parts[cat] = { id: part.id }
      }
      await api.post('/api/builds/save', {
        name: buildName,
        total_price: runningTotal,
        summary: response.summary,
        parts,
      })
      setSaveModalOpen(false)
      setSaved(true)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          navigate('/signin')
          return
        }
        setSaveError(err.message)
      } else {
        setSaveError('Failed to save build. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => {
    setSaveModalOpen(false)
    setSaveError(null)
  }

  return (
    <Container size="xl" py="xl">
      {/* ── Save modal ── */}
      <Modal opened={saveModalOpen} onClose={closeModal} title="Save Build" centered>
        <Stack gap="md">
          {saveError && (
            <Alert color="red" variant="light">
              {saveError}
            </Alert>
          )}
          <TextInput
            label="Build name"
            placeholder="My Build"
            value={buildName}
            onChange={(e) => setBuildName(e.currentTarget.value)}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave} color="brandOrange">
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Title order={2} mb="sm">
        Select Your Components
      </Title>
      <Group gap="sm" mb="xl">
        <Badge color="brandOrange" size="lg">
          {useCaseLabel}
        </Badge>
        <Badge color="brandOrange" size="lg">
          ${budget.toLocaleString()} budget
        </Badge>
      </Group>

      {warnings.length > 0 && (
        <Stack gap="xs" mb="xl">
          {warnings.map((w, i) => (
            <Alert key={i} color="yellow" variant="light">
              {w}
            </Alert>
          ))}
        </Stack>
      )}

      <Grid gutter="xl" align="flex-start">
        {/* Left — component accordions */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Accordion multiple variant="separated">
            {partGroups.map((group) => {
              const selected = selectedParts[group.category]
              const openDetailId =
                detailKey?.cat === group.category ? detailKey.id : null

              return (
                <Accordion.Item key={group.category} value={group.category}>
                  <Accordion.Control>
                    <Group justify="space-between" pr="sm" wrap="nowrap" gap="sm">
                      <Text fw={600} style={{ flexShrink: 0 }}>
                        {CATEGORY_LABELS[group.category] ?? group.category}
                      </Text>
                      {selected && (
                        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                          <Text
                            size="sm"
                            c="dimmed"
                            lineClamp={1}
                            style={{ minWidth: 0, flex: 1 }}
                          >
                            {selected.name}
                          </Text>
                          <Text size="sm" fw={600} c="brandOrange" style={{ flexShrink: 0 }}>
                            ${selected.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      {/* Option cards */}
                      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                        {group.options.map((option) => (
                          <PartRow
                            key={option.id}
                            option={option}
                            isSelected={option.id === selected?.id}
                            isDetailOpen={option.id === openDetailId}
                            onSelect={() =>
                              setSelectedParts((prev) => ({
                                ...prev,
                                [group.category]: option,
                              }))
                            }
                            onDetails={() => handleDetails(group.category, option.id)}
                          />
                        ))}
                      </SimpleGrid>

                      {/* Why blurb for selected part */}
                      {selected?.why && (
                        <Box
                          p="sm"
                          style={{
                            borderRadius: 8,
                            border: `1px solid ${ORANGE}30`,
                            backgroundColor: 'var(--mantine-color-brandOrange-0)',
                          }}
                        >
                          <Text size="sm" lh={1.65}>
                            {selected.why}
                          </Text>
                        </Box>
                      )}

                      {/* Inline detail spec blocks */}
                      {openDetailId != null && (() => {
                        const cacheKey = `${group.category}/${openDetailId}`
                        const detailName =
                          group.options.find((o) => o.id === openDetailId)?.name ?? 'Specs'
                        const detail = detailCache[cacheKey]
                        const isLoading = loadingKey === cacheKey
                        const fields = (COMPONENT_FIELDS[group.category] ?? []).filter(
                          ({ key }) => detail != null && detail[key] != null,
                        )

                        return (
                          <Box>
                            <Divider
                              mb="sm"
                              label={
                                <Text size="xs" fw={600} c="dimmed">
                                  {detailName}
                                </Text>
                              }
                              labelPosition="left"
                            />
                            {isLoading ? (
                              <Center h={72}>
                                <Loader size="sm" color="brandOrange" />
                              </Center>
                            ) : detail ? (
                              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                                {fields.map(({ key, label, format }) => (
                                  <StatBlock
                                    key={key}
                                    label={label}
                                    value={
                                      format
                                        ? format(detail[key])
                                        : String(detail[key])
                                    }
                                  />
                                ))}
                              </SimpleGrid>
                            ) : (
                              <Text size="sm" c="dimmed">
                                Failed to load specs.
                              </Text>
                            )}
                          </Box>
                        )
                      })()}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              )
            })}
          </Accordion>
        </Grid.Col>

        {/* Right — build summary */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="lg" radius="md" style={{ position: 'sticky', top: 20 }}>
            <Title order={4} mb="md">
              Build Summary
            </Title>

            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Budget
              </Text>
              <Text size="sm" fw={600}>
                ${budget.toLocaleString()}
              </Text>
            </Group>

            <Divider mb="md" />

            <Text size="xs" c="dimmed" mb={6}>
              Budget used
            </Text>
            <Progress
              value={budgetPercent}
              color={isOverBudget ? 'red' : budgetPercent > 85 ? 'yellow' : 'brandOrange'}
              size="sm"
              radius="xl"
              mb={4}
            />
            <Group justify="space-between" mb="lg">
              <Text size="xs" c={isOverBudget ? 'red' : 'dimmed'}>
                ${runningTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text size="xs" fw={600} c={isOverBudget ? 'red' : 'dimmed'}>
                {isOverBudget ? `+$${(runningTotal - budget).toFixed(0)} over` : `${budgetPercent}%`}
              </Text>
            </Group>

            <Divider mb="md" />

            <Stack gap={10} mb="md">
              {CATEGORY_ORDER.filter((cat) => selectedParts[cat]).map((cat) => (
                <Group key={cat} justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
                  <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" fw={600}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {selectedParts[cat].name}
                    </Text>
                  </Stack>
                  <Text size="xs" fw={600} style={{ flexShrink: 0, paddingTop: 1 }}>
                    ${selectedParts[cat].price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </Group>
              ))}
            </Stack>

            <Divider mb="sm" />

            <Group justify="space-between" mb="lg">
              <Text fw={700}>Total</Text>
              <Text fw={700} c={isOverBudget ? 'red' : undefined}>
                $
                {runningTotal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </Group>

            {saved ? (
              <Stack gap="xs">
                <Alert color="green" variant="light">
                  Build saved successfully!
                </Alert>
                <Button
                  variant="default"
                  fullWidth
                  size="sm"
                  onClick={() => navigate('/builds')}
                >
                  View Saved Builds
                </Button>
              </Stack>
            ) : (
              <Button fullWidth color="brandOrange" onClick={() => setSaveModalOpen(true)}>
                Save Build
              </Button>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Box mt="xl">
        <AIOverview text={response.summary} />
      </Box>
    </Container>
  )
}
