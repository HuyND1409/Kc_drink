<template>
    <a-layout class="app-layout">
        <SidebarMenu />

        <a-layout class="main-layout">
            <HeaderBar />

            <a-layout-content class="content">
                <router-view />
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts">
import HeaderBar from "./components/HeaderBar.vue";
import SidebarMenu from "./components/SidebarMenu.vue";
</script>

<style scoped>
.app-layout{
    height:100vh;
    overflow:hidden;
}

.main-layout{
    height:100vh;
    min-width:0;
    overflow:hidden;
}

.content{
    margin:20px;
    padding:20px;
    background:white;
    overflow-y:auto;
    overflow-x:hidden;
}
</style>
