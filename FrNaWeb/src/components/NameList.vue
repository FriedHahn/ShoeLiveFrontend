<script setup lang="ts">
const people = ["Anna", "Ben", "Cara"]
</script>

<template>
  <ul>
    <li v-for="person in people" :key="person">
      {{ person }}
    </li>
  </ul>
</template>

<style scoped>

</style>
