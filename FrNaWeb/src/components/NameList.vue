<script setup lang="ts">
const people = ["Friedrich", "Nam", "Test"]
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
