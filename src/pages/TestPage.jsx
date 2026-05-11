// src/pages/TestPage.jsx
import { useEffect } from "react";
import { supabase } from "../services/supabase";

export default function TestPage() {
  useEffect(() => {
    async function test() {
      console.log("🔍 Probando actualización...");
      
      // Buscar un registro sin hora_salida
      const { data: registros } = await supabase
        .from("history")
        .select("*")
        .is("hora_salida", null)
        .limit(1);
      
      if (registros && registros.length > 0) {
        const registro = registros[0];
        console.log("📝 Registro encontrado:", registro);
        
        // Intentar actualizar
        const { error } = await supabase
          .from("history")
          .update({ hora_salida: "PRUEBA" })
          .eq("id", registro.id);
        
        if (error) {
          console.log("❌ Error:", error);
        } else {
          console.log("✅ Actualizado correctamente");
          
          // Verificar
          const { data: verificado } = await supabase
            .from("history")
            .select("hora_salida")
            .eq("id", registro.id);
          console.log("🔍 Verificado:", verificado);
        }
      } else {
        console.log("⚠️ No hay registros sin hora_salida");
      }
    }
    
    test();
  }, []);
  
  return <div className="text-white p-4">Revisá la consola (F12)</div>;
}