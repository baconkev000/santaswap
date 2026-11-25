<script setup lang="ts">
import { computed, ref } from 'vue'

export type MatchGroupDraft = {
  id: string
  name: string
  participantIds: string[]
}

const props = withDefaults(
  defineProps<{
    participants: Array<{ id: string; name: string }>
    modelValue: MatchGroupDraft[]
    preventWithinGroupMatches: boolean
    allowDoubleGifts: boolean
    busy?: boolean
    showSaveButton?: boolean
  }>(),
  { showSaveButton: false },
)

const emit = defineEmits<{
  'update:modelValue': [MatchGroupDraft[]]
  'update:preventWithinGroupMatches': [boolean]
  'update:allowDoubleGifts': [boolean]
  save: []
}>()

const editorOpen = ref(false)
const editingId = ref<string | null>(null)
const draftName = ref('')
const selectedIds = ref<string[]>([])
const formError = ref('')

let nextId = 0

const unassigned = computed(() => {
  const assigned = new Set(props.modelValue.flatMap((group) => group.participantIds))
  return props.participants.filter((p) => !assigned.has(p.id))
})

function participantName(id: string) {
  return props.participants.find((p) => p.id === id)?.name ?? 'Unknown'
}

function openCreate() {
  editingId.value = null
  draftName.value = ''
  selectedIds.value = []
  formError.value = ''
  editorOpen.value = true
}

function openEdit(group: MatchGroupDraft) {
  editingId.value = group.id
  draftName.value = group.name
  selectedIds.value = [...group.participantIds]
  formError.value = ''
  editorOpen.value = true
}

function toggleParticipant(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((value) => value !== id)
    : [...selectedIds.value, id]
}

function cancelEditor() {
  editorOpen.value = false
  formError.value = ''
}

function saveGroup() {
  const name = draftName.value.trim()
  if (!name) {
    formError.value = 'Enter a group name.'
    return
  }
  if (!selectedIds.value.length) {
    formError.value = "Don't save an empty group. Select at least one person."
    return
  }

  const next = props.modelValue.map((group) => ({
    ...group,
    participantIds: group.participantIds.filter((id) => !selectedIds.value.includes(id)),
  }))

  if (editingId.value) {
    const index = next.findIndex((group) => group.id === editingId.value)
    if (index >= 0) {
      next[index] = {
        id: editingId.value,
        name,
        participantIds: [...selectedIds.value],
      }
    }
  } else {
    next.push({
      id: `draft-group-${nextId++}`,
      name,
      participantIds: [...selectedIds.value],
    })
  }

  emit(
    'update:modelValue',
    next.filter((group) => group.participantIds.length > 0),
  )
  editorOpen.value = false
}

function removeGroup(id: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((group) => group.id !== id),
  )
}
</script>

<template>
  <div class="stack">
    <label class="check-row">
      <input
        type="checkbox"
        :checked="preventWithinGroupMatches"
        :disabled="busy"
        @change="
          emit('update:preventWithinGroupMatches', ($event.target as HTMLInputElement).checked)
        "
      />
      <span>
        <strong>Don't match people within the same group</strong>
        <span class="muted check-row__hint">
          Everyone draws someone outside their group — great for households or teams.
        </span>
      </span>
    </label>

    <template v-if="preventWithinGroupMatches">
      <label class="check-row">
        <input
          type="checkbox"
          :checked="allowDoubleGifts"
          :disabled="busy"
          @change="emit('update:allowDoubleGifts', ($event.target as HTMLInputElement).checked)"
        />
        <span>
          <strong>Allow double gifts if needed</strong>
          <span class="muted check-row__hint">
            If a perfect one-to-one draw isn't possible, some people may give or receive two gifts
            so everyone can still play.
          </span>
        </span>
      </label>

      <div v-if="modelValue.length" class="match-group-list">
        <article v-for="group in modelValue" :key="group.id" class="match-group-card">
          <div>
            <h3>{{ group.name }}</h3>
            <p class="muted">
              {{ group.participantIds.map(participantName).join(', ') }}
            </p>
          </div>
          <div class="row">
            <button class="btn btn--ghost btn--small" type="button" :disabled="busy" @click="openEdit(group)">
              Edit
            </button>
            <button class="btn btn--danger btn--small" type="button" :disabled="busy" @click="removeGroup(group.id)">
              Remove
            </button>
          </div>
        </article>
      </div>
      <p v-else class="muted">No groups yet. Add one so SantaSwap knows who shouldn't match.</p>

      <p v-if="unassigned.length" class="muted">
        Not in a group: {{ unassigned.map((p) => p.name).join(', ') }}. Ungrouped folks can match
        with anyone.
      </p>

      <div class="row">
        <button
          class="btn btn--secondary btn--small"
          type="button"
          :disabled="busy || !participants.length"
          @click="openCreate"
        >
          + Add group
        </button>
        <button
          v-if="showSaveButton"
          class="btn btn--small"
          type="button"
          :disabled="busy"
          @click="emit('save')"
        >
          Save groups
        </button>
      </div>

      <div v-if="editorOpen" class="match-group-editor stack">
        <h3>{{ editingId ? 'Edit group' : 'Add group' }}</h3>
        <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>
        <div class="field">
          <label for="match-group-name">Group name</label>
          <input
            id="match-group-name"
            v-model="draftName"
            class="input"
            type="text"
            maxlength="80"
            placeholder="Smith household"
          />
        </div>
        <fieldset class="field">
          <legend>People in this group</legend>
          <label
            v-for="participant in participants"
            :key="participant.id"
            class="check-row check-row--compact"
          >
            <input
              type="checkbox"
              :checked="selectedIds.includes(participant.id)"
              @change="toggleParticipant(participant.id)"
            />
            <span>{{ participant.name }}</span>
          </label>
        </fieldset>
        <div class="row">
          <button class="btn btn--small" type="button" @click="saveGroup">Save group</button>
          <button class="btn btn--ghost btn--small" type="button" @click="cancelEditor">Cancel</button>
        </div>
      </div>
    </template>
  </div>
</template>
