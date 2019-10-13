<template>
    <el-row>
        <el-col class="col col-left" span="6">
            <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick"></el-tree>
        </el-col>
        <el-col class="col col-right" span="18"></el-col>
    </el-row>
</template>
<script>
    export default {
        data(){
            return {
                data: [],
                defaultProps: {
                    children: 'children',
                    label: 'name'
                }
            };
        },
        methods: {
            //获取左侧菜单树
            loadTreeMenu(){
                this.$gpl.get("/product/productType/typeTree").then(result=>{
                    this.data = result.data
                })
            }
        },
        mounted() {
            this.loadTreeMenu();
        }
    }
</script>
<style scoped>
    .col{
        border: 1px solid #ccc;
        height: 600px;
        margin-top: 20px;
    }
    .col-left{
        border-right: none;
        overflow-x: hidden;
        overflow-y: scroll;
    }
    .col-left::-webkit-scrollbar {
        display: none;
    }
    .el-tree{
        border: none
    }
</style>