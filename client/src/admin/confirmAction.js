export function confirmAction({ title, message, confirmLabel = "Confirmer", danger = true }) {
  return new Promise(resolve => {
    const dialog = document.createElement("dialog");
    dialog.className = "cms-native-dialog";
    dialog.innerHTML = `<form method="dialog"><span>CONFIRMATION</span><h2></h2><p></p><footer><button value="cancel">Annuler</button><button class="${danger ? "danger" : "primary"}" value="confirm"></button></footer></form>`;
    dialog.querySelector("h2").textContent = title;
    dialog.querySelector("p").textContent = message;
    dialog.querySelector("button[value=confirm]").textContent = confirmLabel;
    const finish = value => { dialog.remove(); resolve(value); };
    dialog.addEventListener("close", () => finish(dialog.returnValue === "confirm"), { once: true });
    dialog.addEventListener("cancel", event => { event.preventDefault(); dialog.close("cancel"); });
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}
