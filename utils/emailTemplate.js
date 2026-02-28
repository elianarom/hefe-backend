// utils/emailTemplates.js

const verificationEmailTemplate = (name) => {
    return `
    <div style="background-color: #f8fafc; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #2563eb; padding: 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -1px;">
                    hefe
                </h1>
            </div>

            <div style="padding: 40px;">
                <h2 style="color: #111827; font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; margin-bottom: 20px;">
                    ¡HOLA, ${name.split(' ')[0]}!
                </h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Tu perfil ha sido revisado por nuestro equipo y ya tenés el **visto bueno**. A partir de ahora sos un miembro verificado de nuestra comunidad.
                </p>
                
                <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px; border-radius: 0 20px 20px 0;">
                    <p style="color: #1e40af; font-size: 14px; font-weight: bold; margin: 0;">
                        ✓ Ya podés publicar tus herramientas.<br>
                        ✓ Podés contactar a otros dueños para alquilar.<br>
                        ✓ Tu perfil ahora muestra el sello de confianza.
                    </p>
                </div>

                <div style="text-align: center;">
                    <a href="http://localhost:5173/usuario/dashboard" 
                       style="display: inline-block; background-color: #111827; color: #ffffff; padding: 18px 35px; border-radius: 20px; font-weight: 900; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                       IR A MI PANEL
                    </a>
                </div>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="color: #9ca3af; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                    © 2026 HEFE - Herramientas de confianza
                </p>
            </div>
        </div>
    </div>
    `;
};

const rejectionEmailTemplate = (name) => {
    return `
    <div style="background-color: #f8fafc; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #ef4444; padding: 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -1px;">
                    hefe
                </h1>
            </div>

            <div style="padding: 40px;">
                <h2 style="color: #111827; font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; margin-bottom: 20px;">
                    HAY UN DETALLE, ${name.split(' ')[0].toUpperCase()}
                </h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Revisamos tu solicitud de verificación y, por el momento, no pudimos aprobarla. Por lo general, esto sucede por alguno de los siguientes motivos:
                </p>
                
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 30px; border-radius: 0 20px 20px 0;">
                    <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin: 0;">
                        MOTIVO DEL RECHAZO:
                    </p>
                    <p style="color: #b91c1c; font-size: 14px; margin-top: 5px;">
                        ${reason || "Los datos proporcionados no son claros o son insuficientes."}
                    </p>
                </div>

                <p style="color: #4b5563; font-size: 14px; margin-bottom: 30px;">
                    No te preocupes, podés entrar a tu perfil ahora mismo, corregir tus datos y volver a solicitar la verificación.
                </p>

                <div style="text-align: center;">
                    <a href="http://localhost:5173/usuario/perfil" 
                       style="display: inline-block; background-color: #111827; color: #ffffff; padding: 18px 35px; border-radius: 20px; font-weight: 900; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                       EDITAR MI PERFIL
                    </a>
                </div>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="color: #9ca3af; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                    © 2026 HEFE - Herramientas de confianza
                </p>
            </div>
        </div>
    </div>
    `;
};

module.exports = { verificationEmailTemplate, rejectionEmailTemplate };