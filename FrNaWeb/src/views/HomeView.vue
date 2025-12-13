<script setup lang="ts">
import { RouterLink } from "vue-router"
</script>

<template>
  <div class="home-page">
    <div class="home-card">
      <h1 class="home-title">ShoeLive</h1>
      <p class="home-subtitle">Wähle, was du machen möchtest.</p>

      <div class="home-actions">
        <RouterLink :to="{ name: 'create-ad' }" class="home-box home-box-action">
          <h2>Anzeige erstellen</h2>
          <p>Neue Schuhanzeige anlegen.</p>
        </RouterLink>

        <RouterLink :to="{ name: 'ads' }" class="home-box home-box-action">
          <h2>Alle Anzeigen</h2>
          <p>Alle gespeicherten Anzeigen ansehen.</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style>
.home-page {
  min-height: 100vh;
  padding: 40px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-card {
  max-width: 1100px;
  width: 100%;
  background: #ffffff;
  border-radius: 26px;
  padding: 36px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
}

.home-title {
  margin: 0 0 8px 0;
  font-size: 44px;
  font-weight: 900;
  color: #111827;
}

.home-subtitle {
  margin: 0 0 28px 0;
  font-size: 16px;
  color: #6b7280;
  font-weight: 600;
}

.home-actions {
  display: flex;
  gap: 24px;
}

.home-box {
  flex: 1;
  border-radius: 18px;
  padding: 22px 24px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.home-box-action {
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: #ffffff;
  box-shadow: 0 14px 35px rgba(79, 70, 229, 0.45);
}

.home-box-action h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}

.home-box-action p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.home-box-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(79, 70, 229, 0.60);
}
</style>
