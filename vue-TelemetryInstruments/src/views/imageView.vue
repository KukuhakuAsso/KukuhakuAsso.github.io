<template>
    <Teleport to="body">
        <div v-if="visible" class="image-overlay" @click.self="$emit('close')">
            <div class="image-modal">
                <h3>{{ title }}</h3>
                <img :src="imageUrl" :alt="title" class="full-image" />
                <div class="actions">
                    <slot name="actions">
                        <button v-if="showNext" @click="$emit('next')" class="btn-next">进入下一关</button>
                        <button @click="$emit('close')" class="btn-close">关闭</button>
                    </slot>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    imageUrl: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: '新线索'
    },
    showNext: {
        type: Boolean,
        default: false
    }
})

defineEmits(['close', 'next'])
</script>

<style scoped>
.image-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.image-modal {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 80vw;
    max-height: 90vh;
    text-align: center;
    overflow: auto;
}

.full-image {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border: 1px solid #ccc;
    margin: 1rem 0;
}

.actions button {
    margin: 0.5rem;
    padding: 0.6rem 1.5rem;
    font-size: 1rem;
}
</style>
