<template>

    <a-layout style="min-height:100vh">

        <SidebarMenu />

        <a-layout>

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

.content{

    margin:20px;

    padding:20px;

    background:white;

}

</style>
